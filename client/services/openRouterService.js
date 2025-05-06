class OpenRouterService {
  constructor() {
    this.siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.siteName = 'Tummy Time Baby Care Assistant';
    this.currentModel = "openai/gpt-3.5-turbo";
    this.guideContent = null;
  }

  /**
   * Load the TummyTimeGuide content from the public directory
   */
  async loadGuideContent() {
    if (this.guideContent) {
      return this.guideContent;
    }

    try {
      const response = await fetch('/data/TummyTimeGuide.md');
      if (!response.ok) {
        console.error('Failed to load TummyTimeGuide.md');
        return null;
      }
      
      this.guideContent = await response.text();
      return this.guideContent;
    } catch (error) {
      console.error('Error loading guide:', error);
      return null;
    }
  }

  async generateResponse(prompt, conversationHistory = []) {
    try {
      // Load the guide content
      await this.loadGuideContent();
      
      // Construct a system message that includes the guide content and JSON format instructions
      const systemMessage = {
        role: "system",
        content: `You are the assistant for Tummy Time, a baby care app. You provide accurate, helpful advice for parents and caregivers of children ages 0-7.

APPLICATION FEATURES:
* Baby Profiles: Users can add and manage multiple baby profiles through the "Add Baby" button on the dashboard
* Growth Tracking: Parents can monitor weight, height, and other developmental metrics
* Feeding Schedules: Create and manage feeding times and types
* Milestone Tracking: Record and celebrate developmental milestones
* Journal: Document memorable moments and daily activities
* Reminders: Set reminders for feedings, medications, appointments, etc.
* Health Records: Store and share medical information with healthcare providers
* Childcare Services: Find and save favorite caregivers in your area
* Community Forum: Connect with other parents for advice and support

Your primary role is to:
1) Answer questions about infant/child care, development, health, and parenting
2) Explain how to use the app features when asked
3) Provide evidence-based advice in a friendly, supportive manner

RESPONSE FORMAT INSTRUCTIONS:
Always respond with a valid JSON object that contains two fields:
1. "conversation_title": A concise, descriptive title (max 40 chars) for this conversation based on the user's query
2. "response": Your actual detailed response to the user's question, formatted in HTML

Here's the exact JSON structure to use:
{
  "conversation_title": "Brief, descriptive title for this conversation",
  "response": "<p>Your detailed answer in HTML format</p><ul><li>Use proper HTML tags</li><li>For all formatting</li></ul>"
}

HTML FORMATTING GUIDELINES:
- Use <p> tags for paragraphs
- Use <ol> and <li> for numbered lists
- Use <ul> and <li> for bullet points
- Use <strong> for bold text
- Use <em> for italic/emphasized text
- Ensure proper HTML structure and nesting

Only decline to answer if a query is genuinely harmful (promoting abuse, neglect) or completely unrelated to children, parenting or the app (like cryptocurrency trading).

IMPORTANT: When users ask about app functionality or how to perform specific tasks in the app, you MUST use the information from the official Tummy Time App Guide below to provide accurate instructions.

-------- BEGIN TUMMY TIME APP GUIDE --------
${this.guideContent || "Guide content unavailable. Please refer to the app's help section."}
-------- END TUMMY TIME APP GUIDE --------`
      };

      const userMessage = {
        role: "user",
        content: prompt
      };

      const messages = [systemMessage];
      
      if (conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }
      
      messages.push(userMessage);

      try {
        // Use the Next.js API route
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.currentModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate response');
        }

        const data = await response.json();
        
        if (data && data.choices && data.choices.length > 0) {
          const content = data.choices[0].message.content;
          
          // Parse the JSON response
          try {
            // Check if the response is already JSON
            if (typeof content === 'object') {
              return content;
            }
            
            // Parse the JSON string
            const parsedJson = JSON.parse(content);
            return {
              conversationTitle: parsedJson.conversation_title,
              responseText: parsedJson.response
            };
          } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            
            // If JSON parsing fails, return the raw response
            return {
              conversationTitle: "Baby Care Advice",
              responseText: content
            };
          }
        }
        
        throw new Error("No response generated from API");
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  async isModelReady() {
    try {
      const response = await fetch('/api/chat', {
        method: 'GET',
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status === 'ready';
    } catch (error) {
      return false;
    }
  }
}

const openRouterService = new OpenRouterService();
export default openRouterService;