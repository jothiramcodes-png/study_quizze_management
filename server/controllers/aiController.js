const { pool } = require('../config/database');

async function generateQuiz(req, res) {
  const { topic, difficulty, numQuestions, quizType } = req.body;
  const createdBy = req.user.id;

  if (!topic) {
    return res.status(400).json({ success: false, message: 'Topic is required' });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured in .env file.');
    }

    console.log("Sending quiz generation request to OpenRouter...");
    
    const systemPrompt = `You are an expert educational AI. Generate a quiz about the following topic.
Return ONLY a valid JSON object with the following structure, no markdown formatting, no comments:
{
  "title": "Quiz Title",
  "description": "Quiz description",
  "questions": [
    {
      "question_text": "Question text here",
      "explanation": "Explanation for the correct answer",
      "options": [
        { "text": "Option A", "is_correct": true },
        { "text": "Option B", "is_correct": false },
        { "text": "Option C", "is_correct": false },
        { "text": "Option D", "is_correct": false }
      ]
    }
  ]
}
Ensure exactly ${numQuestions || 5} questions. Difficulty: ${difficulty || 'medium'}. Type: ${quizType || 'academic'}.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'MindTrack AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic: ${topic}` }
          ],
          max_tokens: 2000
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter failed with status: ${response.status} - ${errorText}`);
    }

    const jsonResponse = await response.json();
    const responseText = jsonResponse.choices[0].message.content;
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let quizData;
    try {
      quizData = JSON.parse(cleanText);
      if (quizData && quizData.quiz) {
        if (typeof quizData.quiz === 'string') {
          quizData = JSON.parse(quizData.quiz);
        } else {
          quizData = quizData.quiz;
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse OpenRouter output:", cleanText);
      return res.status(500).json({ success: false, message: 'AI returned invalid JSON formatting' });
    }

    if (!quizData || !Array.isArray(quizData.questions)) {
      console.error("Invalid schema returned from AI:", cleanText);
      return res.status(500).json({ success: false, message: 'AI returned JSON, but it is missing the "questions" array.' });
    }

    // Insert into Database
    const conn = await pool.connect();
    try {
      await conn.query('BEGIN');

      // 1. Insert Quiz
      const { rows: quizResult } = await conn.query(
        `INSERT INTO quizzes (title, description, topic, quiz_type, difficulty, total_questions, total_marks, duration_mins, created_by, ai_generated) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [quizData.title, quizData.description, topic, quizType || 'academic', difficulty || 'medium', quizData.questions.length, quizData.questions.length, (quizData.questions.length * 2), createdBy, true]
      );
      
      const quizId = quizResult[0].id;

      // 2. Insert Questions and Options
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        const { rows: qResult } = await conn.query(
          `INSERT INTO questions (quiz_id, question_text, question_type, marks, explanation, order_num) VALUES ($1, $2, 'mcq', 1, $3, $4) RETURNING id`,
          [quizId, q.question_text, q.explanation || null, i + 1]
        );
        const questionId = qResult[0].id;

        const labels = ['A', 'B', 'C', 'D', 'E'];
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await conn.query(
            `INSERT INTO options (question_id, option_text, is_correct, option_label) VALUES ($1, $2, $3, $4)`,
            [questionId, opt.text, opt.is_correct, labels[j] || '']
          );
        }
      }

      await conn.query('COMMIT');
      conn.release();

      res.json({ success: true, message: 'Quiz generated successfully', data: { quizId, ...quizData } });
    } catch (dbErr) {
      await conn.query('ROLLBACK');
      conn.release();
      throw dbErr;
    }

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { generateQuiz };
