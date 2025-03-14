// lib/groq.ts
import Constants from 'expo-constants';

// Define message types for the AI API
type MessageRole = 'system' | 'user' | 'assistant';

type Message = {
  role: MessageRole;
  content: string;
};

// GROQ API integration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;
const MODEL = 'llama3-70b-8192'; // Using Llama 3 70B model for medical advice (good quality responses)

// Function to generate AI responses
export async function generateAIResponse(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  try {
    // Format messages for the API
    const formattedMessages: Message[] = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      // Default system prompt
      formattedMessages.push({
        role: 'system',
        content: 'You are a helpful health assistant. Provide accurate and helpful information about health topics. IMPORTANT: Always provide a disclaimer that you\'re not a medical professional and that the user should seek professional medical advice for their health concerns.'
      });
    }
    
    // Add conversation history
    messages.forEach(msg => {
      formattedMessages.push({
        role: msg.role as MessageRole,
        content: msg.content
      });
    });
    
    // Make request to GROQ API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        temperature: 0.3, // Lower temperature for more factual/medical responses
        max_tokens: 1024
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('GROQ API error:', errorData);
      throw new Error(`GROQ API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.\n\nRemember: I am not a medical professional, and you should always consult with a healthcare provider for medical advice.';
  }
}

// Function to extract health topics from user messages
export async function extractHealthTopics(content: string): Promise<string[]> {
  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'Extract and list the main health topics or medical conditions mentioned in the following text. Return ONLY a JSON array of strings with no additional text.'
      },
      {
        role: 'user',
        content
      }
    ];
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 256
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to extract health topics');
    }
    
    const data = await response.json();
    const topicsText = data.choices[0].message.content;
    
    try {
      // Try to parse as JSON
      return JSON.parse(topicsText);
    } catch (e) {
      // If not valid JSON, try to extract array-like text
      const matches = topicsText.match(/\[(.*)\]/s);
      if (matches && matches[1]) {
        const items = matches[1].split(',').map(item => 
          item.trim().replace(/"/g, '').replace(/'/g, '')
        );
        return items.filter(item => item.length > 0);
      }
      return [];
    }
  } catch (error) {
    console.error('Error extracting health topics:', error);
    return [];
  }
}

// Generate a summary of a conversation
export async function generateConversationSummary(messages: { role: string; content: string }[]): Promise<string> {
  try {
    // Filter for just the conversation content
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    const summaryMessages: Message[] = [
      {
        role: 'system',
        content: 'Create a brief title (max 40 characters) that summarizes the main health topic of this conversation.'
      },
      {
        role: 'user',
        content: conversationText
      }
    ];
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: summaryMessages,
        temperature: 0.3,
        max_tokens: 60
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate conversation summary');
    }
    
    const data = await response.json();
    let summary = data.choices[0].message.content.trim();
    
    // Remove quotes if the AI wrapped the title in quotes
    summary = summary.replace(/^["'](.*)["']$/, '$1');
    
    // Ensure it's not too long
    if (summary.length > 40) {
      summary = summary.substring(0, 37) + '...';
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return 'Health Conversation';
  }
}