export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          updated_at: string | null;
          ai_provider: string | null;
          user_type: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          ai_provider?: string | null;
          user_type?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          ai_provider?: string | null;
          user_type?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          created_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          date: string;
          name: string;
          amount: number;
          description: string | null;
          created_at: string | null;
          account_id: string | null;
          status: string;
          transfer_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          date: string;
          name: string;
          amount: number;
          description?: string | null;
          created_at?: string | null;
          account_id?: string | null;
          status?: string;
          transfer_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          date?: string;
          name?: string;
          amount?: number;
          description?: string | null;
          created_at?: string | null;
          account_id?: string | null;
          status?: string;
          transfer_id?: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          month: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          month: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          month?: string;
          created_at?: string | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank: string;
          type: string;
          balance: number;
          created_at: string | null;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          bank: string;
          type: string;
          balance?: number;
          created_at?: string | null;
          is_default?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          bank?: string;
          type?: string;
          balance?: number;
          created_at?: string | null;
          is_default?: boolean;
        };
      };
      banks: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          color: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
}

export type User = {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    user_type?: string | null;
  } | null;
};

export type Bank = Database['public']['Tables']['banks']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];