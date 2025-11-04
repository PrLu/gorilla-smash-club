export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          location: string;
          format: 'singles' | 'doubles' | 'mixed';
          entry_fee: number;
          max_participants: number | null;
          status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          location: string;
          format: 'singles' | 'doubles' | 'mixed';
          entry_fee: number;
          max_participants?: number | null;
          status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          location?: string;
          format?: 'singles' | 'doubles' | 'mixed';
          entry_fee?: number;
          max_participants?: number | null;
          status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          rating: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          rating?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          rating?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          player1_id: string;
          player2_id: string | null;
          tournament_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          player1_id: string;
          player2_id?: string | null;
          tournament_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          player1_id?: string;
          player2_id?: string | null;
          tournament_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          tournament_id: string;
          player_id: string | null;
          team_id: string | null;
          status: 'pending' | 'confirmed' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'refunded';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          player_id?: string | null;
          team_id?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          player_id?: string | null;
          team_id?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          bracket_id: string | null;
          round: number;
          match_number: number;
          player1_id: string | null;
          player2_id: string | null;
          team1_id: string | null;
          team2_id: string | null;
          score1: number | null;
          score2: number | null;
          winner_id: string | null;
          winner_team_id: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at: string | null;
          court: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          bracket_id?: string | null;
          round: number;
          match_number: number;
          player1_id?: string | null;
          player2_id?: string | null;
          team1_id?: string | null;
          team2_id?: string | null;
          score1?: number | null;
          score2?: number | null;
          winner_id?: string | null;
          winner_team_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at?: string | null;
          court?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          bracket_id?: string | null;
          round?: number;
          match_number?: number;
          player1_id?: string | null;
          player2_id?: string | null;
          team1_id?: string | null;
          team2_id?: string | null;
          score1?: number | null;
          score2?: number | null;
          winner_id?: string | null;
          winner_team_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at?: string | null;
          court?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brackets: {
        Row: {
          id: string;
          tournament_id: string;
          type: 'single_elimination' | 'double_elimination' | 'round_robin';
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          type: 'single_elimination' | 'double_elimination' | 'round_robin';
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          type?: 'single_elimination' | 'double_elimination' | 'round_robin';
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          registration_id: string;
          amount: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          status: 'pending' | 'succeeded' | 'failed' | 'refunded';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tournament_format: 'singles' | 'doubles' | 'mixed';
      tournament_status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
      match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      registration_status: 'pending' | 'confirmed' | 'cancelled';
      payment_status: 'pending' | 'paid' | 'refunded';
      bracket_type: 'single_elimination' | 'double_elimination' | 'round_robin';
    };
  };
}

