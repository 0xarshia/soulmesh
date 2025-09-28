// API Service for handling all external API calls
class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable for API base URL, fallback to relative path for development
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  async getChatResponse(content: string, skipChatHistory: boolean = false): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/sensay-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          skip_chat_history: skipChatHistory,
          source: "discord",
          discord_data: {
            channel_id: "string",
            channel_name: "string",
            author_id: "string",
            author_name: "string",
            message_id: "string",
            created_at: "string",
            server_id: "string",
            server_name: "string"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  async getReplySuggestions(message: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/sensay-reply-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Reply suggestions API error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
