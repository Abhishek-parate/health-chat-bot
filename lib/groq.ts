// lib/groq.ts
const GROQ_API_KEY = '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';

interface Message {
  role: string;
  content: string;
}

export async function generateAIResponse(messages: Message[]): Promise<string> {
  try {
    console.log("Generating response for:", messages[messages.length-1]?.content);
    
    // React Native implementation for Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using the model from the docs
        messages: [
          {
            role: 'system',
            content: 'You are a helpful healthcare assistant providing general health information. Always remind users to consult with healthcare professionals for medical advice. Avoid diagnosing conditions or prescribing treatments.'
          },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Groq API error: ${response.status}`);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fall back to mock responses if API fails
    return generateMockResponse(messages);
  }
}

// Mock response function for development or fallback
function generateMockResponse(messages: Message[]): Promise<string> {
  return new Promise((resolve) => {
    // Simulate a delay to mimic API call
    setTimeout(() => {
      // Get the last user message
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      const query = lastUserMessage?.content.toLowerCase() || '';
      
      console.log("Processing query:", query); // Debug log
      
      if (query.includes('headache')) {
        resolve("Headaches can have many causes including stress, dehydration, lack of sleep, or eyestrain. For occasional headaches, rest, staying hydrated, and over-the-counter pain relievers might help. If you're experiencing severe, persistent, or unusual headaches, it's important to consult with a healthcare provider for proper evaluation.");
      }
      else if (query.includes('exercise') || query.includes('workout')) {
        resolve("Regular physical activity is essential for maintaining good health. The CDC recommends at least 150 minutes of moderate-intensity exercise per week, along with muscle-strengthening activities twice a week. Remember to start slowly if you're new to exercise and consult with a healthcare provider if you have any underlying health conditions.");
      }
      else if (query.includes('diet') || query.includes('nutrition') || query.includes('eat')) {
        resolve("A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. The Mediterranean diet and DASH diet are often recommended for overall health. Remember, individual nutritional needs can vary, so what works for one person may not be optimal for another. A registered dietitian can provide personalized guidance.");
      }
      else if (query.includes('sleep')) {
        resolve("Quality sleep is crucial for physical and mental health. Most adults need 7-9 hours of sleep per night. To improve sleep quality, try maintaining a consistent sleep schedule, creating a restful environment, limiting screen time before bed, and avoiding caffeine and alcohol close to bedtime. If you consistently struggle with sleep, consider discussing it with a healthcare provider.");
      }
      else if (query.includes('cold') || query.includes('flu')) {
        resolve("Common cold and flu symptoms include runny nose, cough, sore throat, and fever (more common with flu). Rest, hydration, and over-the-counter medications can help manage symptoms. Most colds resolve within 7-10 days. If symptoms are severe or persistent, it's best to consult with a healthcare provider.");
      }
      else if (query.includes('stress') || query.includes('anxiety')) {
        resolve("Stress and anxiety are common experiences. Management techniques include regular exercise, adequate sleep, deep breathing exercises, mindfulness meditation, and maintaining social connections. If stress or anxiety significantly impacts your daily life, consider speaking with a mental health professional for personalized strategies.");
      }
      else if (query.includes('vitamin') || query.includes('mineral') || query.includes('supplement')) {
        resolve("Vitamins and minerals are essential nutrients that your body needs in small amounts for normal functioning. While a balanced diet typically provides sufficient nutrients, supplements may be recommended in specific cases. It's best to consult with a healthcare provider before starting any supplement regimen, as some can interact with medications or have side effects.");
      }
      else if (query.includes('blood pressure') || query.includes('hypertension')) {
        resolve("Blood pressure is the force of blood pushing against the walls of your arteries. Normal blood pressure is below 120/80 mm Hg. Lifestyle factors that can help maintain healthy blood pressure include reducing sodium intake, regular physical activity, maintaining a healthy weight, limiting alcohol, and managing stress. Regular monitoring is important, especially if you have risk factors for hypertension.");
      }
      else if (query.includes('diabetes')) {
        resolve("Diabetes is a chronic condition affecting how your body turns food into energy. The main types are Type 1, Type 2, and gestational diabetes. Management typically involves monitoring blood sugar levels, medication or insulin as prescribed, healthy eating, regular physical activity, and maintaining a healthy weight. Regular check-ups with healthcare providers are essential for managing diabetes effectively.");
      }
      else {
        // If no specific keywords match, generate a more personalized response
        const topics = ['general health', 'wellness', 'preventive care', 'medical information', 'health tips'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        resolve(`I understand you're asking about ${query.slice(0, 30)}... As a health assistant, I can provide general information about ${randomTopic}, but I'm not able to diagnose conditions or provide personalized medical advice. Could you please ask a more specific health-related question so I can better assist you? Some topics I can help with include diet, exercise, sleep, common conditions, and preventive care.`);
      }
    }, 1000);
  });
}