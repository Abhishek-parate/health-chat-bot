// scripts/generateMockData.js
// This script helps you populate your Supabase database with test data
// Run with: node generateMockData.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin rights

// Ensure we have the required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data
const users = [
  {
    email: 'patient1@example.com',
    password: 'Password123!',
    userData: {
      full_name: 'John Smith',
      role: 'user',
      phone_number: '+1234567890',
      phone_verified: true,
      bio: 'Regular user with health concerns',
      status: 'online'
    }
  },
  {
    email: 'patient2@example.com',
    password: 'Password123!',
    userData: {
      full_name: 'Maria Garcia',
      role: 'user',
      phone_number: '+1987654321',
      phone_verified: true,
      bio: 'Health-conscious individual',
      status: 'offline'
    }
  },
  {
    email: 'doctor1@example.com',
    password: 'Password123!',
    userData: {
      full_name: 'Dr. Sarah Johnson',
      role: 'doctor',
      phone_number: '+1122334455',
      phone_verified: true,
      specialty: 'General Medicine',
      years_experience: 10,
      bio: 'Experienced general practitioner with focus on preventive care',
      status: 'online'
    }
  },
  {
    email: 'doctor2@example.com',
    password: 'Password123!',
    userData: {
      full_name: 'Dr. Michael Chen',
      role: 'doctor',
      phone_number: '+1555666777',
      phone_verified: true,
      specialty: 'Cardiology',
      years_experience: 15,
      bio: 'Specialist in heart health and cardiovascular diseases',
      status: 'busy'
    }
  },
  {
    email: 'admin@example.com',
    password: 'Password123!',
    userData: {
      full_name: 'Admin User',
      role: 'admin',
      phone_number: '+1999888777',
      phone_verified: true,
      bio: 'System administrator',
      status: 'online'
    }
  }
];

const healthTopics = [
  {
    title: 'Nutrition',
    icon: '🍎',
    color: '#10b981',
    gradient: ['#0bab6c', '#07bc8b'],
    description: 'Healthy eating habits and nutritional information'
  },
  {
    title: 'Exercise',
    icon: '🏃',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#f7b045'],
    description: 'Physical activity recommendations and fitness tips'
  },
  {
    title: 'Mental Health',
    icon: '🧠',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#a78bfa'],
    description: 'Tips for maintaining good mental health and managing stress'
  },
  {
    title: 'Sleep',
    icon: '😴',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#60a5fa'],
    description: 'Improving sleep quality and establishing healthy sleep patterns'
  },
  {
    title: 'Heart Health',
    icon: '❤️',
    color: '#ef4444',
    gradient: ['#ef4444', '#f87171'],
    description: 'Information about cardiovascular health and preventing heart disease'
  },
  {
    title: 'Hydration',
    icon: '💧',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#22d3ee'],
    description: 'Importance of hydration and water intake recommendations'
  }
];

// Sample conversations and messages
const sampleConversations = [
  {
    title: 'General Health Query',
    aiMessages: [
      'Hello! I\'m having frequent headaches lately. What could be causing this?',
      'I usually get them in the afternoon, and they\'re mostly around my temples.',
      'About 3-4 times per week for the last month.',
      'I\'ve been taking over-the-counter pain relievers, but they only help temporarily.',
      'Thank you for the advice. I\'ll try tracking my water intake and screen time.'
    ]
  },
  {
    title: 'Diet Consultation',
    aiMessages: [
      'I\'m trying to improve my diet. What are some healthy breakfast options?',
      'I usually skip breakfast or just grab a coffee on my way to work.',
      'I\'m mostly looking to have more energy throughout the day and maybe lose a few pounds.',
      'Those are great suggestions! I think I could definitely prepare overnight oats the evening before.',
      'Would adding fruits to my breakfast be beneficial?'
    ]
  },
  {
    title: 'Sleep Issues',
    aiMessages: [
      'I\'ve been having trouble sleeping. I toss and turn for hours before falling asleep.',
      'I typically go to bed around 11 PM but don\'t fall asleep until 1 AM sometimes.',
      'I do look at my phone before bed. And sometimes I work late on my laptop.',
      'I haven\'t tried a consistent bedtime routine. That sounds helpful.',
      'I\'ll try implementing these suggestions. Thank you!'
    ]
  }
];

const doctorConsultations = [
  {
    reason: 'Persistent headaches not responding to over-the-counter medication',
    patientMessages: [
      'Hello Dr. Johnson, I\'ve been experiencing severe headaches for about 3 weeks now.',
      'They usually start in the afternoon and get worse by evening.',
      'Yes, I\'ve tried ibuprofen but it only helps for a few hours.',
      'No, I haven\'t noticed any specific triggers, though they seem worse on stressful days.',
      'Thank you, I appreciate your advice and will follow your recommendations.'
    ],
    doctorMessages: [
      'Hello John, I\'m sorry to hear you\'re experiencing headaches. Can you tell me more about when they occur and how long they last?',
      'Have you tried any medications to relieve the pain? If so, which ones and did they help?',
      'Have you noticed any triggers for your headaches, such as certain foods, stress, or lack of sleep?',
      'Based on what you\'ve described, these sound like tension headaches. I recommend tracking your water intake, reducing screen time, and practicing some stress-reduction techniques. If they persist for another week, we should consider further evaluation.',
      'You\'re welcome. Please update me on your progress in a few days. If the headaches worsen or you experience any new symptoms, let me know right away.'
    ]
  },
  {
    reason: 'Heart palpitations and chest discomfort',
    patientMessages: [
      'Dr. Chen, I\'ve been experiencing occasional heart palpitations and some chest discomfort.',
      'They started about two weeks ago. I feel like my heart is racing or skipping beats.',
      'I\'m 45 years old, have slightly high blood pressure, and my father had a heart attack at 60.',
      'No, I don\'t smoke, but I do drink coffee regularly, about 3-4 cups a day.',
      'Yes, I can come in for an ECG tomorrow. Thank you for your prompt attention to this.'
    ],
    doctorMessages: [
      'Hello Maria, I understand you\'re experiencing heart palpitations. Can you describe when they occur and how long they last?',
      'When did these symptoms start? And do you have any pain or discomfort along with the palpitations?',
      'Thank you for sharing that information. What\'s your age and do you have any personal or family history of heart conditions?',
      'Do you smoke or consume caffeine regularly? Both can sometimes trigger palpitations.',
      'Given your symptoms and family history, I\'d like to schedule you for an electrocardiogram (ECG) to check your heart\'s electrical activity. Let\'s also reduce your caffeine intake to see if that helps. Can you come in tomorrow for the ECG?'
    ]
  }
];

// Function to create a user with Supabase Auth and add profile data
async function createUser(userData) {
  try {
    // Create the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email so we don't need to verify
      user_metadata: {
        full_name: userData.userData.full_name
      }
    });

    if (authError) {
      console.error(`Error creating user ${userData.email}:`, authError);
      return null;
    }

    console.log(`Created user: ${userData.email} with ID: ${authData.user.id}`);

    // Create profile record
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        ...userData.userData
      }])
      .select();

    if (profileError) {
      console.error(`Error creating profile for ${userData.email}:`, profileError);
      return null;
    }

    return authData.user;
  } catch (error) {
    console.error(`Unexpected error creating user ${userData.email}:`, error);
    return null;
  }
}

// Function to create health topics
async function createHealthTopics() {
  try {
    for (const topic of healthTopics) {
      const { data, error } = await supabase
        .from('health_topics')
        .insert([topic])
        .select();

      if (error) {
        console.error(`Error creating health topic ${topic.title}:`, error);
      } else {
        console.log(`Created health topic: ${topic.title}`);
      }
    }
  } catch (error) {
    console.error('Error creating health topics:', error);
  }
}

// Function to create AI conversations for a user
async function createAIConversationsForUser(userId) {
  try {
    // Create 1-3 random AI conversations
    const numConversations = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numConversations; i++) {
      // Select a random conversation template
      const template = sampleConversations[Math.floor(Math.random() * sampleConversations.length)];
      
      // Create conversation
      const { data: convoData, error: convoError } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          title: template.title,
          is_doctor_chat: false,
          status: 'active'
        }])
        .select();
      
      if (convoError) {
        console.error(`Error creating conversation for user ${userId}:`, convoError);
        continue;
      }
      
      const conversationId = convoData[0].id;
      console.log(`Created conversation: ${template.title} with ID: ${conversationId}`);
      
      // Add welcome message
      await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: 'assistant',
          content: 'Hello! I\'m your HealthAssist AI. How can I help you today?',
          is_read: true
        }]);
      
      // Add messages
      for (const userMessage of template.aiMessages) {
        // Add user message
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: userId,
            role: 'user',
            content: userMessage,
            is_read: true
          }]);
        
        // Add AI response
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            role: 'assistant',
            content: generateAIResponse(userMessage),
            is_read: true
          }]);
      }
      
      console.log(`Added ${template.aiMessages.length * 2} messages to conversation ${conversationId}`);
    }
  } catch (error) {
    console.error(`Error creating AI conversations for user ${userId}:`, error);
  }
}

// Function to create doctor conversations between a patient and doctor
async function createDoctorConsultation(patientId, doctorId) {
  try {
    // Select a random consultation template
    const template = doctorConsultations[Math.floor(Math.random() * doctorConsultations.length)];
    
    // Create a doctor request first
    const { data: requestData, error: requestError } = await supabase
      .from('doctor_requests')
      .insert([{
        user_id: patientId,
        reason: template.reason,
        status: 'approved'
      }])
      .select();
    
    if (requestError) {
      console.error(`Error creating doctor request for patient ${patientId}:`, requestError);
      return;
    }
    
    // Create conversation
    const { data: convoData, error: convoError } = await supabase
      .from('conversations')
      .insert([{
        user_id: patientId,
        doctor_id: doctorId,
        title: 'Doctor Consultation',
        is_doctor_chat: true,
        status: 'active'
      }])
      .select();
    
    if (convoError) {
      console.error(`Error creating doctor conversation:`, convoError);
      return;
    }
    
    const conversationId = convoData[0].id;
    console.log(`Created doctor consultation between patient ${patientId} and doctor ${doctorId}`);
    
    // Update the doctor request with the conversation ID
    await supabase
      .from('doctor_requests')
      .update({ conversation_id: conversationId })
      .eq('id', requestData[0].id);
    
    // Add system message
    await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Your request to speak with a healthcare professional has been approved. You are now connected with a doctor.',
        is_read: true
      }]);
    
    // Add messages
    for (let i = 0; i < template.patientMessages.length; i++) {
      // Add patient message
      await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: patientId,
          role: 'user',
          content: template.patientMessages[i],
          is_read: true
        }]);
      
      // Add doctor response
      await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: doctorId,
          role: 'doctor',
          content: template.doctorMessages[i],
          is_read: false
        }]);
    }
    
    console.log(`Added ${template.patientMessages.length * 2} messages to doctor consultation ${conversationId}`);
  } catch (error) {
    console.error(`Error creating doctor consultation:`, error);
  }
}

// Generate a mock AI response
function generateAIResponse(userMessage) {
  // Simple mock responses based on keywords
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('headache') || lowerMessage.includes('pain')) {
    return "Headaches can have many causes including stress, dehydration, lack of sleep, or eyestrain. For occasional headaches, rest, staying hydrated, and over-the-counter pain relievers might help. If you're experiencing severe, persistent, or unusual headaches, it's important to consult with a healthcare provider.";
  }
  
  if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('breakfast') || lowerMessage.includes('food')) {
    return "A balanced diet is key for good health. For breakfast, consider options like overnight oats with fruit, Greek yogurt with nuts and berries, or whole grain toast with avocado. These provide sustained energy and important nutrients. Adding fruits to your breakfast is definitely beneficial as they provide vitamins, minerals, and fiber.";
  }
  
  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
    return "Good sleep hygiene can help improve sleep quality. Consider establishing a consistent sleep schedule, creating a relaxing bedtime routine, limiting screen time before bed, and ensuring your sleep environment is comfortable. If you struggle with persistent insomnia, it might be worth discussing with a healthcare professional.";
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
    return "Managing stress is important for overall wellbeing. Consider techniques like deep breathing, meditation, regular physical activity, and maintaining social connections. If stress or anxiety significantly impacts your daily life, speaking with a mental health professional can provide personalized strategies.";
  }
  
  return "Thank you for sharing that information. It's important to maintain regular check-ups with healthcare providers for personalized advice. Is there anything specific about your health concerns you'd like to discuss further?";
}

// Main function to run all data generation
async function generateAllData() {
  console.log('Starting to generate mock data...');
  
  // Create users first
  const createdUsers = {};
  for (const user of users) {
    const createdUser = await createUser(user);
    if (createdUser) {
      createdUsers[user.userData.role] = createdUsers[user.userData.role] || [];
      createdUsers[user.userData.role].push(createdUser);
    }
  }
  
  // Create health topics
  await createHealthTopics();
  
  // Create AI conversations for regular users
  if (createdUsers.user) {
    for (const user of createdUsers.user) {
      await createAIConversationsForUser(user.id);
    }
  }
  
  // Create doctor consultations between patients and doctors
  if (createdUsers.user && createdUsers.doctor) {
    for (const user of createdUsers.user) {
      // 50% chance of having a doctor consultation
      if (Math.random() > 0.5) {
        const doctor = createdUsers.doctor[Math.floor(Math.random() * createdUsers.doctor.length)];
        await createDoctorConsultation(user.id, doctor.id);
      }
    }
  }
  
  console.log('Mock data generation complete!');
}

// Run the data generation
generateAllData().catch(error => {
  console.error('Error in data generation:', error);
});