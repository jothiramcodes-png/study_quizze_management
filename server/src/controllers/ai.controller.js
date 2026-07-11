const prisma = require('../prisma');

const generateQuiz = async (req, res) => {
  const { topic, difficulty, numQuestions, quizType } = req.body;
  const createdBy = req.user.userId;

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

    const totalQuestions = quizData.questions.length;
    
    // Create the Quiz and all related models via Prisma nested writes!
    const newQuiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        topic,
        quizType: quizType || 'academic',
        difficulty: difficulty || 'medium',
        totalMarks: totalQuestions * 1, // Assuming 1 mark per question
        durationMins: totalQuestions * 2,
        createdById: createdBy,
        aiGenerated: true,
        questions: {
          create: quizData.questions.map((q, i) => {
            const labels = ['A', 'B', 'C', 'D', 'E'];
            return {
              questionText: q.question_text,
              explanation: q.explanation || null,
              orderNum: i + 1,
              marks: 1,
              optionsList: {
                create: q.options.map((opt, j) => ({
                  optionText: opt.text,
                  isCorrect: opt.is_correct,
                  optionLabel: labels[j] || ''
                }))
              }
            };
          })
        }
      }
    });

    res.json({ success: true, message: 'Quiz generated successfully', data: { quizId: newQuiz.id, ...quizData } });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateQuiz };
