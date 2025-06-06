export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          currency: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          currency?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          currency?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          institution: string
          type: "checking" | "savings" | "credit" | "investment" | "loan"
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          institution: string
          type: "checking" | "savings" | "credit" | "investment" | "loan"
          balance: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          institution?: string
          type?: "checking" | "savings" | "credit" | "investment" | "loan"
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          date: string
          description: string
          amount: number
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          date: string
          description: string
          amount: number
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          date?: string
          description?: string
          amount?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          user_id: string
          name: string
          type: "investment" | "loan"
          parameters: any
          results: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: "investment" | "loan"
          parameters: any
          results: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: "investment" | "loan"
          parameters?: any
          results?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
