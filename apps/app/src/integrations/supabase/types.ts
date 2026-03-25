export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accessibility_profiles: {
        Row: {
          assistance_description: string | null
          auto_apply_to_rides: boolean | null
          avoid_features: string[] | null
          can_transfer_independently: boolean | null
          created_at: string | null
          driver_notes: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          has_service_animal: boolean | null
          id: string
          is_blind: boolean | null
          is_deaf: boolean | null
          is_hard_of_hearing: boolean | null
          is_low_vision: boolean | null
          metadata: Json | null
          needs_simple_instructions: boolean | null
          preferred_communication: string | null
          preferred_vehicle_features: string[] | null
          requires_audio_assistance: boolean | null
          requires_cognitive_support: boolean | null
          requires_crutches: boolean | null
          requires_physical_assistance: boolean | null
          requires_visual_assistance: boolean | null
          requires_walker: boolean | null
          requires_wheelchair: boolean | null
          service_animal_certified: boolean | null
          service_animal_type: string | null
          updated_at: string | null
          user_id: string
          wheelchair_type: string | null
        }
        Insert: {
          assistance_description?: string | null
          auto_apply_to_rides?: boolean | null
          avoid_features?: string[] | null
          can_transfer_independently?: boolean | null
          created_at?: string | null
          driver_notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_service_animal?: boolean | null
          id?: string
          is_blind?: boolean | null
          is_deaf?: boolean | null
          is_hard_of_hearing?: boolean | null
          is_low_vision?: boolean | null
          metadata?: Json | null
          needs_simple_instructions?: boolean | null
          preferred_communication?: string | null
          preferred_vehicle_features?: string[] | null
          requires_audio_assistance?: boolean | null
          requires_cognitive_support?: boolean | null
          requires_crutches?: boolean | null
          requires_physical_assistance?: boolean | null
          requires_visual_assistance?: boolean | null
          requires_walker?: boolean | null
          requires_wheelchair?: boolean | null
          service_animal_certified?: boolean | null
          service_animal_type?: string | null
          updated_at?: string | null
          user_id: string
          wheelchair_type?: string | null
        }
        Update: {
          assistance_description?: string | null
          auto_apply_to_rides?: boolean | null
          avoid_features?: string[] | null
          can_transfer_independently?: boolean | null
          created_at?: string | null
          driver_notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_service_animal?: boolean | null
          id?: string
          is_blind?: boolean | null
          is_deaf?: boolean | null
          is_hard_of_hearing?: boolean | null
          is_low_vision?: boolean | null
          metadata?: Json | null
          needs_simple_instructions?: boolean | null
          preferred_communication?: string | null
          preferred_vehicle_features?: string[] | null
          requires_audio_assistance?: boolean | null
          requires_cognitive_support?: boolean | null
          requires_crutches?: boolean | null
          requires_physical_assistance?: boolean | null
          requires_visual_assistance?: boolean | null
          requires_walker?: boolean | null
          requires_wheelchair?: boolean | null
          service_animal_certified?: boolean | null
          service_animal_type?: string | null
          updated_at?: string | null
          user_id?: string
          wheelchair_type?: string | null
        }
        Relationships: []
      }
      accessibility_ride_requests: {
        Row: {
          assistance_description: string | null
          assistance_rating: number | null
          created_at: string | null
          driver_confirmed: boolean | null
          driver_confirmed_at: string | null
          feedback: string | null
          id: string
          matched_driver_id: string | null
          metadata: Json | null
          needs_met: boolean | null
          requires_audio_assistance: boolean | null
          requires_certified_driver: boolean | null
          requires_cognitive_support: boolean | null
          requires_physical_assistance: boolean | null
          requires_service_animal_space: boolean | null
          requires_trained_driver: boolean | null
          requires_visual_assistance: boolean | null
          requires_wheelchair_vehicle: boolean | null
          ride_booking_id: string
          special_instructions: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistance_description?: string | null
          assistance_rating?: number | null
          created_at?: string | null
          driver_confirmed?: boolean | null
          driver_confirmed_at?: string | null
          feedback?: string | null
          id?: string
          matched_driver_id?: string | null
          metadata?: Json | null
          needs_met?: boolean | null
          requires_audio_assistance?: boolean | null
          requires_certified_driver?: boolean | null
          requires_cognitive_support?: boolean | null
          requires_physical_assistance?: boolean | null
          requires_service_animal_space?: boolean | null
          requires_trained_driver?: boolean | null
          requires_visual_assistance?: boolean | null
          requires_wheelchair_vehicle?: boolean | null
          ride_booking_id: string
          special_instructions?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistance_description?: string | null
          assistance_rating?: number | null
          created_at?: string | null
          driver_confirmed?: boolean | null
          driver_confirmed_at?: string | null
          feedback?: string | null
          id?: string
          matched_driver_id?: string | null
          metadata?: Json | null
          needs_met?: boolean | null
          requires_audio_assistance?: boolean | null
          requires_certified_driver?: boolean | null
          requires_cognitive_support?: boolean | null
          requires_physical_assistance?: boolean | null
          requires_service_animal_space?: boolean | null
          requires_trained_driver?: boolean | null
          requires_visual_assistance?: boolean | null
          requires_wheelchair_vehicle?: boolean | null
          ride_booking_id?: string
          special_instructions?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_category: string | null
          action_type: string
          admin_user_id: string
          changes_made: Json | null
          created_at: string | null
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_category?: string | null
          action_type: string
          admin_user_id: string
          changes_made?: Json | null
          created_at?: string | null
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_category?: string | null
          action_type?: string
          admin_user_id?: string
          changes_made?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          failed_login_attempts: number | null
          first_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_login_at: string | null
          last_login_ip: string | null
          last_name: string
          locked_until: string | null
          metadata: Json | null
          notes: string | null
          permissions: Json | null
          phone_number: string | null
          profile_photo_url: string | null
          role: string
          timezone: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          failed_login_attempts?: number | null
          first_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_name: string
          locked_until?: string | null
          metadata?: Json | null
          notes?: string | null
          permissions?: Json | null
          phone_number?: string | null
          profile_photo_url?: string | null
          role: string
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          failed_login_attempts?: number | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_name?: string
          locked_until?: string | null
          metadata?: Json | null
          notes?: string | null
          permissions?: Json | null
          phone_number?: string | null
          profile_photo_url?: string | null
          role?: string
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bislama_achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      bislama_lessons: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_minutes: number
          id: string
          order_index: number
          title: string
          title_bislama: string
          topic_id: string | null
          xp_reward: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          order_index?: number
          title: string
          title_bislama: string
          topic_id?: string | null
          xp_reward?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          order_index?: number
          title?: string
          title_bislama?: string
          topic_id?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "bislama_lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "bislama_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      bislama_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          hint: string | null
          id: string
          lesson_id: string | null
          options: Json
          order_index: number
          question_bislama: string | null
          question_text: string
          question_type: string
          xp_value: number
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          hint?: string | null
          id?: string
          lesson_id?: string | null
          options?: Json
          order_index?: number
          question_bislama?: string | null
          question_text: string
          question_type?: string
          xp_value?: number
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          hint?: string | null
          id?: string
          lesson_id?: string | null
          options?: Json
          order_index?: number
          question_bislama?: string | null
          question_text?: string
          question_type?: string
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "bislama_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "bislama_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      bislama_topics: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          difficulty: string
          icon: string
          id: string
          name: string
          name_bislama: string
          order_index: number
          total_lessons: number
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          name: string
          name_bislama: string
          order_index?: number
          total_lessons?: number
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          name?: string
          name_bislama?: string
          order_index?: number
          total_lessons?: number
        }
        Relationships: []
      }
      bislama_words: {
        Row: {
          audio_url: string | null
          bislama: string
          created_at: string | null
          english: string
          example_bislama: string | null
          example_english: string | null
          id: string
          image_url: string | null
          lesson_id: string | null
          pronunciation: string | null
        }
        Insert: {
          audio_url?: string | null
          bislama: string
          created_at?: string | null
          english: string
          example_bislama?: string | null
          example_english?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          pronunciation?: string | null
        }
        Update: {
          audio_url?: string | null
          bislama?: string
          created_at?: string | null
          english?: string
          example_bislama?: string | null
          example_english?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          pronunciation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bislama_words_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "bislama_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          answered_at: string | null
          booking_id: string | null
          call_cost: number | null
          call_status: string
          call_type: string
          caller_id: string
          caller_type: string
          connection_quality: string | null
          created_at: string | null
          currency: string | null
          duration_seconds: number | null
          emergency_reason: string | null
          ended_at: string | null
          id: string
          initiated_at: string | null
          is_emergency: boolean | null
          is_recorded: boolean | null
          masked_caller_number: string | null
          masked_receiver_number: string | null
          metadata: Json | null
          provider: string | null
          provider_call_id: string | null
          provider_session_id: string | null
          quality_feedback: string | null
          quality_rating: number | null
          receiver_id: string
          receiver_type: string
          recording_duration: number | null
          recording_url: string | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          answered_at?: string | null
          booking_id?: string | null
          call_cost?: number | null
          call_status?: string
          call_type?: string
          caller_id: string
          caller_type: string
          connection_quality?: string | null
          created_at?: string | null
          currency?: string | null
          duration_seconds?: number | null
          emergency_reason?: string | null
          ended_at?: string | null
          id?: string
          initiated_at?: string | null
          is_emergency?: boolean | null
          is_recorded?: boolean | null
          masked_caller_number?: string | null
          masked_receiver_number?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_call_id?: string | null
          provider_session_id?: string | null
          quality_feedback?: string | null
          quality_rating?: number | null
          receiver_id: string
          receiver_type: string
          recording_duration?: number | null
          recording_url?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          answered_at?: string | null
          booking_id?: string | null
          call_cost?: number | null
          call_status?: string
          call_type?: string
          caller_id?: string
          caller_type?: string
          connection_quality?: string | null
          created_at?: string | null
          currency?: string | null
          duration_seconds?: number | null
          emergency_reason?: string | null
          ended_at?: string | null
          id?: string
          initiated_at?: string | null
          is_emergency?: boolean | null
          is_recorded?: boolean | null
          masked_caller_number?: string | null
          masked_receiver_number?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_call_id?: string | null
          provider_session_id?: string | null
          quality_feedback?: string | null
          quality_rating?: number | null
          receiver_id?: string
          receiver_type?: string
          recording_duration?: number | null
          recording_url?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      call_quality_reports: {
        Row: {
          call_log_id: string
          created_at: string | null
          description: string | null
          device_info: Json | null
          id: string
          issue_type: string
          network_info: Json | null
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          call_log_id: string
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          issue_type: string
          network_info?: Json | null
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          call_log_id?: string
          created_at?: string | null
          description?: string | null
          device_info?: Json | null
          id?: string
          issue_type?: string
          network_info?: Json | null
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_quality_reports_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          charged_to: string | null
          created_at: string | null
          fee_amount: number | null
          fee_type: string
          id: string
          is_active: boolean | null
          policy_name: string
          priority: number | null
          ride_status: string | null
          service_type: string
          time_threshold_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          charged_to?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          policy_name: string
          priority?: number | null
          ride_status?: string | null
          service_type: string
          time_threshold_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          charged_to?: string | null
          created_at?: string | null
          fee_amount?: number | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          policy_name?: string
          priority?: number | null
          ride_status?: string | null
          service_type?: string
          time_threshold_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string | null
          hotel_id: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          participant1_id: string
          participant1_unread: number | null
          participant2_id: string
          participant2_unread: number | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          hotel_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant1_id: string
          participant1_unread?: number | null
          participant2_id: string
          participant2_unread?: number | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          hotel_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant1_id?: string
          participant1_unread?: number | null
          participant2_id?: string
          participant2_unread?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "hotel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_accessibility_training: {
        Row: {
          accepts_service_animal_requests: boolean | null
          accepts_special_assistance_requests: boolean | null
          accepts_wheelchair_requests: boolean | null
          accessibility_rating: number | null
          accessibility_rides_completed: number | null
          cognitive_support_trained: boolean | null
          cognitive_training_date: string | null
          cpr_cert_date: string | null
          cpr_cert_expiry: string | null
          cpr_certified: boolean | null
          created_at: string | null
          driver_id: string
          general_accessibility_certified: boolean | null
          general_cert_date: string | null
          general_cert_expiry: string | null
          hearing_impairment_trained: boolean | null
          hearing_training_date: string | null
          id: string
          metadata: Json | null
          service_animal_trained: boolean | null
          service_animal_training_date: string | null
          training_certificates: string[] | null
          updated_at: string | null
          visual_impairment_trained: boolean | null
          visual_training_date: string | null
          wheelchair_assistance_certified: boolean | null
          wheelchair_cert_date: string | null
          wheelchair_cert_expiry: string | null
        }
        Insert: {
          accepts_service_animal_requests?: boolean | null
          accepts_special_assistance_requests?: boolean | null
          accepts_wheelchair_requests?: boolean | null
          accessibility_rating?: number | null
          accessibility_rides_completed?: number | null
          cognitive_support_trained?: boolean | null
          cognitive_training_date?: string | null
          cpr_cert_date?: string | null
          cpr_cert_expiry?: string | null
          cpr_certified?: boolean | null
          created_at?: string | null
          driver_id: string
          general_accessibility_certified?: boolean | null
          general_cert_date?: string | null
          general_cert_expiry?: string | null
          hearing_impairment_trained?: boolean | null
          hearing_training_date?: string | null
          id?: string
          metadata?: Json | null
          service_animal_trained?: boolean | null
          service_animal_training_date?: string | null
          training_certificates?: string[] | null
          updated_at?: string | null
          visual_impairment_trained?: boolean | null
          visual_training_date?: string | null
          wheelchair_assistance_certified?: boolean | null
          wheelchair_cert_date?: string | null
          wheelchair_cert_expiry?: string | null
        }
        Update: {
          accepts_service_animal_requests?: boolean | null
          accepts_special_assistance_requests?: boolean | null
          accepts_wheelchair_requests?: boolean | null
          accessibility_rating?: number | null
          accessibility_rides_completed?: number | null
          cognitive_support_trained?: boolean | null
          cognitive_training_date?: string | null
          cpr_cert_date?: string | null
          cpr_cert_expiry?: string | null
          cpr_certified?: boolean | null
          created_at?: string | null
          driver_id?: string
          general_accessibility_certified?: boolean | null
          general_cert_date?: string | null
          general_cert_expiry?: string | null
          hearing_impairment_trained?: boolean | null
          hearing_training_date?: string | null
          id?: string
          metadata?: Json | null
          service_animal_trained?: boolean | null
          service_animal_training_date?: string | null
          training_certificates?: string[] | null
          updated_at?: string | null
          visual_impairment_trained?: boolean | null
          visual_training_date?: string | null
          wheelchair_assistance_certified?: boolean | null
          wheelchair_cert_date?: string | null
          wheelchair_cert_expiry?: string | null
        }
        Relationships: []
      }
      driver_applications: {
        Row: {
          application_data: Json | null
          created_at: string | null
          current_step: number | null
          decision_date: string | null
          decision_notes: string | null
          driver_id: string
          id: string
          metadata: Json | null
          resubmission_count: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          step_background_check: boolean | null
          step_documents: boolean | null
          step_license: boolean | null
          step_personal_info: boolean | null
          step_vehicle: boolean | null
          submitted_at: string | null
          total_steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          decision_date?: string | null
          decision_notes?: string | null
          driver_id: string
          id?: string
          metadata?: Json | null
          resubmission_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step_background_check?: boolean | null
          step_documents?: boolean | null
          step_license?: boolean | null
          step_personal_info?: boolean | null
          step_vehicle?: boolean | null
          submitted_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          decision_date?: string | null
          decision_notes?: string | null
          driver_id?: string
          id?: string
          metadata?: Json | null
          resubmission_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step_background_check?: boolean | null
          step_documents?: boolean | null
          step_license?: boolean | null
          step_personal_info?: boolean | null
          step_vehicle?: boolean | null
          submitted_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_applications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          specific_date: string | null
          start_time: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          specific_date?: string | null
          start_time: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          driver_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          specific_date?: string | null
          start_time?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string | null
          document_type: string
          driver_id: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          notes: string | null
          rejection_reason: string | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          driver_id: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          driver_id?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings: {
        Row: {
          bonus_amount: number | null
          bonus_reason: string | null
          booking_id: string
          commission_calculation: Json | null
          commission_percentage: number | null
          created_at: string | null
          deduction_amount: number | null
          deduction_reason: string | null
          driver_earning: number
          driver_id: string
          earned_at: string | null
          id: string
          net_earning: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          payout_id: string | null
          platform_commission: number
          service_type: string
          total_fare: number
        }
        Insert: {
          bonus_amount?: number | null
          bonus_reason?: string | null
          booking_id: string
          commission_calculation?: Json | null
          commission_percentage?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          driver_earning: number
          driver_id: string
          earned_at?: string | null
          id?: string
          net_earning: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          payout_id?: string | null
          platform_commission: number
          service_type: string
          total_fare: number
        }
        Update: {
          bonus_amount?: number | null
          bonus_reason?: string | null
          booking_id?: string
          commission_calculation?: Json | null
          commission_percentage?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          driver_earning?: number
          driver_id?: string
          earned_at?: string | null
          id?: string
          net_earning?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          payout_id?: string | null
          platform_commission?: number
          service_type?: string
          total_fare?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          driver_id: string
          heading: number | null
          id: string
          is_moving: boolean | null
          latitude: number
          location: unknown
          longitude: number
          metadata: Json | null
          recorded_at: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          is_moving?: boolean | null
          latitude: number
          location: unknown
          longitude: number
          metadata?: Json | null
          recorded_at?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          is_moving?: boolean | null
          latitude?: number
          location?: unknown
          longitude?: number
          metadata?: Json | null
          recorded_at?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payouts: {
        Row: {
          completed_at: string | null
          created_at: string | null
          driver_id: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          net_payout: number
          notes: string | null
          payment_method: string
          payment_provider: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: string
          total_bonuses: number | null
          total_deductions: number | null
          total_earnings: number
          total_rides: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          driver_id: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          net_payout: number
          notes?: string | null
          payment_method: string
          payment_provider?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_bonuses?: number | null
          total_deductions?: number | null
          total_earnings: number
          total_rides?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          net_payout?: number
          notes?: string | null
          payment_method?: string
          payment_provider?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_bonuses?: number | null
          total_deductions?: number | null
          total_earnings?: number
          total_rides?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_schedule_preferences: {
        Row: {
          created_at: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id: string
          is_active: boolean | null
          preferred_areas: string[] | null
          scheduled_ride_premium_percent: number | null
          service_radius_km: number | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          driver_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          preferred_areas?: string[] | null
          scheduled_ride_premium_percent?: number | null
          service_radius_km?: number | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          driver_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          preferred_areas?: string[] | null
          scheduled_ride_premium_percent?: number | null
          service_radius_km?: number | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          driver_id: string
          has_car_seat: boolean | null
          has_pet_carrier: boolean | null
          id: string
          inspection_status: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          insurance_verified: boolean | null
          is_active: boolean | null
          is_primary: boolean | null
          last_inspection_date: string | null
          license_plate: string
          luggage_capacity: number | null
          make: string
          metadata: Json | null
          model: string
          next_inspection_due: string | null
          passenger_capacity: number | null
          registration_expiry: string | null
          registration_number: string | null
          rejection_reason: string | null
          updated_at: string | null
          vehicle_photos: string[] | null
          vehicle_type: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          wheelchair_accessible: boolean | null
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          driver_id: string
          has_car_seat?: boolean | null
          has_pet_carrier?: boolean | null
          id?: string
          inspection_status?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_inspection_date?: string | null
          license_plate: string
          luggage_capacity?: number | null
          make: string
          metadata?: Json | null
          model: string
          next_inspection_due?: string | null
          passenger_capacity?: number | null
          registration_expiry?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          vehicle_photos?: string[] | null
          vehicle_type: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          wheelchair_accessible?: boolean | null
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          driver_id?: string
          has_car_seat?: boolean | null
          has_pet_carrier?: boolean | null
          id?: string
          inspection_status?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_verified?: boolean | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_inspection_date?: string | null
          license_plate?: string
          luggage_capacity?: number | null
          make?: string
          metadata?: Json | null
          model?: string
          next_inspection_due?: string | null
          passenger_capacity?: number | null
          registration_expiry?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          vehicle_photos?: string[] | null
          vehicle_type?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          wheelchair_accessible?: boolean | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          acceptance_rate: number | null
          accepts_deliveries: boolean | null
          address_line1: string | null
          address_line2: string | null
          application_status: string | null
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          background_check_date: string | null
          background_check_expiry: string | null
          background_check_provider: string | null
          background_check_status: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bio: string | null
          cancellation_rate: number | null
          cancelled_rides: number | null
          city: string | null
          completed_rides: number | null
          country: string | null
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          current_ride_id: string | null
          date_of_birth: string | null
          delivery_handling_fee: number | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          last_active_at: string | null
          last_name: string | null
          license_expiry_date: string | null
          license_issue_date: string | null
          license_number: string | null
          license_plate: string
          license_type: string | null
          license_verified: boolean | null
          metadata: Json | null
          mobile_money_number: string | null
          mobile_money_provider: string | null
          national_id: string | null
          notes: string | null
          paid_earnings: number | null
          passport_number: string | null
          pending_earnings: number | null
          phone_number: string | null
          postal_code: string | null
          preferred_areas: string[] | null
          preferred_service_types: string[] | null
          profile_photo_url: string | null
          province: string | null
          rating: number | null
          rejection_reason: string | null
          safety_training_completed: boolean | null
          safety_training_date: string | null
          status: string
          tax_id: string | null
          total_earnings: number | null
          total_ratings: number | null
          total_rides: number | null
          updated_at: string | null
          user_id: string
          vehicle_color: string | null
          vehicle_model: string
          vehicle_type: string
          verification_status: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          accepts_deliveries?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          application_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          background_check_date?: string | null
          background_check_expiry?: string | null
          background_check_provider?: string | null
          background_check_status?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          cancelled_rides?: number | null
          city?: string | null
          completed_rides?: number | null
          country?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          current_ride_id?: string | null
          date_of_birth?: string | null
          delivery_handling_fee?: number | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_number?: string | null
          license_plate: string
          license_type?: string | null
          license_verified?: boolean | null
          metadata?: Json | null
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          national_id?: string | null
          notes?: string | null
          paid_earnings?: number | null
          passport_number?: string | null
          pending_earnings?: number | null
          phone_number?: string | null
          postal_code?: string | null
          preferred_areas?: string[] | null
          preferred_service_types?: string[] | null
          profile_photo_url?: string | null
          province?: string | null
          rating?: number | null
          rejection_reason?: string | null
          safety_training_completed?: boolean | null
          safety_training_date?: string | null
          status?: string
          tax_id?: string | null
          total_earnings?: number | null
          total_ratings?: number | null
          total_rides?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_color?: string | null
          vehicle_model: string
          vehicle_type: string
          verification_status?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          accepts_deliveries?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          application_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          background_check_date?: string | null
          background_check_expiry?: string | null
          background_check_provider?: string | null
          background_check_status?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          cancelled_rides?: number | null
          city?: string | null
          completed_rides?: number | null
          country?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          current_ride_id?: string | null
          date_of_birth?: string | null
          delivery_handling_fee?: number | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_number?: string | null
          license_plate?: string
          license_type?: string | null
          license_verified?: boolean | null
          metadata?: Json | null
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          national_id?: string | null
          notes?: string | null
          paid_earnings?: number | null
          passport_number?: string | null
          pending_earnings?: number | null
          phone_number?: string | null
          postal_code?: string | null
          preferred_areas?: string[] | null
          preferred_service_types?: string[] | null
          profile_photo_url?: string | null
          province?: string | null
          rating?: number | null
          rejection_reason?: string | null
          safety_training_completed?: boolean | null
          safety_training_date?: string | null
          status?: string
          tax_id?: string | null
          total_earnings?: number | null
          total_ratings?: number | null
          total_rides?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string
          vehicle_type?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_current_ride_id_fkey"
            columns: ["current_ride_id"]
            isOneToOne: false
            referencedRelation: "ride_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_alerts: {
        Row: {
          affected_areas: string[] | null
          affected_islands: string[] | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          effective_until: string | null
          evacuation_required: boolean | null
          id: string
          instructions: string[] | null
          issued_at: string | null
          official_link: string | null
          resolved_at: string | null
          severity: string
          shelter_locations: string[] | null
          source: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_areas?: string[] | null
          affected_islands?: string[] | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description: string
          effective_until?: string | null
          evacuation_required?: boolean | null
          id?: string
          instructions?: string[] | null
          issued_at?: string | null
          official_link?: string | null
          resolved_at?: string | null
          severity?: string
          shelter_locations?: string[] | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_areas?: string[] | null
          affected_islands?: string[] | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          effective_until?: string | null
          evacuation_required?: boolean | null
          id?: string
          instructions?: string[] | null
          issued_at?: string | null
          official_link?: string | null
          resolved_at?: string | null
          severity?: string
          shelter_locations?: string[] | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          is_verified: boolean | null
          name: string
          phone_number: string
          priority_order: number | null
          relationship: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          name: string
          phone_number: string
          priority_order?: number | null
          relationship?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone_number?: string
          priority_order?: number | null
          relationship?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_reports: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          island: string | null
          latitude: number | null
          longitude: number | null
          photo_urls: string[] | null
          resolved_at: string | null
          responder_notes: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_urls?: string[] | null
          resolved_at?: string | null
          responder_notes?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_urls?: string[] | null
          resolved_at?: string | null
          responder_notes?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_services: {
        Row: {
          address: string | null
          alternate_phone: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_24_hours: boolean | null
          is_active: boolean | null
          island: string | null
          name: string
          phone_number: string
          priority: number | null
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_24_hours?: boolean | null
          is_active?: boolean | null
          island?: string | null
          name: string
          phone_number: string
          priority?: number | null
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_24_hours?: boolean | null
          is_active?: boolean | null
          island?: string | null
          name?: string
          phone_number?: string
          priority?: number | null
        }
        Relationships: []
      }
      food_orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          items: Json
          payment_method: string | null
          rating: number | null
          restaurant_id: string
          status: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items: Json
          payment_method?: string | null
          rating?: number | null
          restaurant_id: string
          status?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          payment_method?: string | null
          rating?: number | null
          restaurant_id?: string
          status?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_amenities: {
        Row: {
          amenity_name: string
          category: string
          created_at: string | null
          hotel_id: string
          id: string
          is_free: boolean | null
        }
        Insert: {
          amenity_name: string
          category: string
          created_at?: string | null
          hotel_id: string
          id?: string
          is_free?: boolean | null
        }
        Update: {
          amenity_name?: string
          category?: string
          created_at?: string | null
          hotel_id?: string
          id?: string
          is_free?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_amenities_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_bookings: {
        Row: {
          booking_status: string
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          hotel_id: string
          id: string
          number_of_guests: number
          number_of_nights: number
          number_of_rooms: number | null
          payment_method: string | null
          payment_method_id: string | null
          payment_reference: string | null
          payment_status: string | null
          room_id: string
          room_price: number
          special_requests: string | null
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          hotel_id: string
          id?: string
          number_of_guests: number
          number_of_nights: number
          number_of_rooms?: number | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_id: string
          room_price: number
          special_requests?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          hotel_id?: string
          id?: string
          number_of_guests?: number
          number_of_nights?: number
          number_of_rooms?: number | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_id?: string
          room_price?: number
          special_requests?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_owners: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_name: string
          business_registration_number: string | null
          contact_person: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          phone_number: string
          tax_id: string | null
          total_properties: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name: string
          business_registration_number?: string | null
          contact_person: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          phone_number: string
          tax_id?: string | null
          total_properties?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name?: string
          business_registration_number?: string | null
          contact_person?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string
          tax_id?: string | null
          total_properties?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      hotel_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          hotel_id: string
          id: string
          is_primary: boolean | null
          photo_url: string
          room_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          hotel_id: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          room_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          hotel_id?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_photos_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_photos_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_reviews: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number | null
          comment: string | null
          created_at: string | null
          hotel_id: string
          id: string
          is_verified: boolean | null
          location_rating: number | null
          owner_response: string | null
          owner_response_at: string | null
          rating: number
          service_rating: number | null
          title: string | null
          updated_at: string | null
          user_id: string
          value_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          hotel_id: string
          id?: string
          is_verified?: boolean | null
          location_rating?: number | null
          owner_response?: string | null
          owner_response_at?: string | null
          rating: number
          service_rating?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          value_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          hotel_id?: string
          id?: string
          is_verified?: boolean | null
          location_rating?: number | null
          owner_response?: string | null
          owner_response_at?: string | null
          rating?: number
          service_rating?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "hotel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_reviews_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_rooms: {
        Row: {
          amenities: string[] | null
          available_rooms: number
          base_price: number
          bed_type: string | null
          created_at: string | null
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean | null
          max_occupancy: number
          name: string
          number_of_beds: number | null
          room_type: string
          size_sqm: number | null
          total_rooms: number
          updated_at: string | null
          weekend_price: number | null
        }
        Insert: {
          amenities?: string[] | null
          available_rooms?: number
          base_price: number
          bed_type?: string | null
          created_at?: string | null
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean | null
          max_occupancy: number
          name: string
          number_of_beds?: number | null
          room_type: string
          size_sqm?: number | null
          total_rooms?: number
          updated_at?: string | null
          weekend_price?: number | null
        }
        Update: {
          amenities?: string[] | null
          available_rooms?: number
          base_price?: number
          bed_type?: string | null
          created_at?: string | null
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          max_occupancy?: number
          name?: string
          number_of_beds?: number | null
          room_type?: string
          size_sqm?: number | null
          total_rooms?: number
          updated_at?: string | null
          weekend_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address_line1: string
          address_line2: string | null
          average_rating: number | null
          cancellation_policy: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          featured: boolean | null
          house_rules: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string
          phone_number: string | null
          postal_code: string | null
          province: string | null
          star_rating: number | null
          status: string | null
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          average_rating?: number | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          house_rules?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id: string
          phone_number?: string | null
          postal_code?: string | null
          province?: string | null
          star_rating?: number | null
          status?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          average_rating?: number | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          house_rules?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone_number?: string | null
          postal_code?: string | null
          province?: string | null
          star_rating?: number | null
          status?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "hotel_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      language_preferences: {
        Row: {
          created_at: string
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          area: string | null
          category: string
          condition: string | null
          contact_email: string | null
          contact_phone: string
          contact_whatsapp: string | null
          created_at: string | null
          currency: string | null
          description: string
          expires_at: string | null
          flag_reason: string | null
          id: string
          images: string[] | null
          is_flagged: boolean | null
          is_verified: boolean | null
          island: string
          latitude: number | null
          listing_type: string | null
          longitude: number | null
          message_count: number | null
          price: number
          price_negotiable: boolean | null
          save_count: number | null
          show_phone: boolean | null
          sold_at: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          area?: string | null
          category: string
          condition?: string | null
          contact_email?: string | null
          contact_phone: string
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          expires_at?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          island: string
          latitude?: number | null
          listing_type?: string | null
          longitude?: number | null
          message_count?: number | null
          price: number
          price_negotiable?: boolean | null
          save_count?: number | null
          show_phone?: boolean | null
          sold_at?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          area?: string | null
          category?: string
          condition?: string | null
          contact_email?: string | null
          contact_phone?: string
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          expires_at?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          island?: string
          latitude?: number | null
          listing_type?: string | null
          longitude?: number | null
          message_count?: number | null
          price?: number
          price_negotiable?: boolean | null
          save_count?: number | null
          show_phone?: boolean | null
          sold_at?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      marketplace_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          listing_id: string
          message: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id: string
          message: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string
          message?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_saves: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_saves_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      masked_number_pool: {
        Row: {
          assigned_at: string | null
          can_sms: boolean | null
          can_voice: boolean | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          currently_assigned_to: string | null
          id: string
          is_available: boolean | null
          metadata: Json | null
          monthly_cost: number | null
          per_minute_cost: number | null
          phone_number: string
          provider: string
          provider_sid: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          can_sms?: boolean | null
          can_voice?: boolean | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          currently_assigned_to?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          monthly_cost?: number | null
          per_minute_cost?: number | null
          phone_number: string
          provider: string
          provider_sid?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          can_sms?: boolean | null
          can_voice?: boolean | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          currently_assigned_to?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          monthly_cost?: number | null
          per_minute_cost?: number | null
          phone_number?: string
          provider?: string
          provider_sid?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_updates: boolean
          created_at: string
          email_enabled: boolean
          id: string
          promotions: boolean
          push_enabled: boolean
          system_alerts: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          booking_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          promotions?: boolean
          push_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          booking_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          promotions?: boolean
          push_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_html: string | null
          body_text: string
          created_at: string | null
          enabled_channels: string[] | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          subject: string | null
          template_category: string | null
          template_key: string
          template_name: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_html?: string | null
          body_text: string
          created_at?: string | null
          enabled_channels?: string[] | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subject?: string | null
          template_category?: string | null
          template_key: string
          template_name: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string | null
          body_text?: string
          created_at?: string | null
          enabled_channels?: string[] | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subject?: string | null
          template_category?: string | null
          template_key?: string
          template_name?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          driver_rating: number | null
          id: string
          order_id: string
          restaurant_rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          driver_rating?: number | null
          id?: string
          order_id: string
          restaurant_rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          driver_rating?: number | null
          id?: string
          order_id?: string
          restaurant_rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_configurations: {
        Row: {
          api_key: string | null
          api_secret: string | null
          config_data: Json | null
          created_at: string | null
          endpoint_url: string | null
          id: string
          is_enabled: boolean | null
          max_amount: number | null
          merchant_id: string | null
          min_amount: number | null
          provider: string
          sandbox_mode: boolean | null
          supported_currencies: string[] | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          config_data?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_enabled?: boolean | null
          max_amount?: number | null
          merchant_id?: string | null
          min_amount?: number | null
          provider: string
          sandbox_mode?: boolean | null
          supported_currencies?: string[] | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          config_data?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_enabled?: boolean | null
          max_amount?: number | null
          merchant_id?: string | null
          min_amount?: number | null
          provider?: string
          sandbox_mode?: boolean | null
          supported_currencies?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          card_brand: string | null
          card_expiry: string | null
          card_last_four: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          method_type: string
          provider_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          method_type: string
          provider_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          method_type?: string
          provider_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          cod_collected: boolean | null
          cod_collected_at: string | null
          cod_collector_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          payment_method: string
          payment_method_id: string | null
          provider_reference: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          service_type: string
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          cod_collected?: boolean | null
          cod_collected_at?: string | null
          cod_collector_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_method: string
          payment_method_id?: string | null
          provider_reference?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          service_type: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          cod_collected?: boolean | null
          cod_collected_at?: string | null
          cod_collector_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_method_id?: string | null
          provider_reference?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          service_type?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_masking: {
        Row: {
          assigned_at: string | null
          booking_id: string | null
          calls_made: number | null
          calls_received: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          masked_number: string
          masked_number_provider: string | null
          metadata: Json | null
          paired_with_user_id: string | null
          real_phone_number: string
          released_at: string | null
          total_call_duration: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          booking_id?: string | null
          calls_made?: number | null
          calls_received?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          masked_number: string
          masked_number_provider?: string | null
          metadata?: Json | null
          paired_with_user_id?: string | null
          real_phone_number: string
          released_at?: string | null
          total_call_duration?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          booking_id?: string | null
          calls_made?: number | null
          calls_received?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          masked_number?: string
          masked_number_provider?: string | null
          metadata?: Json | null
          paired_with_user_id?: string | null
          real_phone_number?: string
          released_at?: string | null
          total_call_duration?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_analytics: {
        Row: {
          active_drivers: number | null
          active_users: number | null
          average_rating: number | null
          average_ride_duration: number | null
          average_wait_time: number | null
          cancelled_rides: number | null
          completed_rides: number | null
          completion_rate: number | null
          created_at: string | null
          driver_earnings: number | null
          id: string
          metadata: Json | null
          new_users: number | null
          online_drivers: number | null
          pending_rides: number | null
          period_end: string
          period_start: string
          period_type: string
          platform_commission: number | null
          refunds_issued: number | null
          top_dropoff_locations: Json | null
          top_pickup_locations: Json | null
          total_drivers: number | null
          total_revenue: number | null
          total_rides: number | null
          total_users: number | null
        }
        Insert: {
          active_drivers?: number | null
          active_users?: number | null
          average_rating?: number | null
          average_ride_duration?: number | null
          average_wait_time?: number | null
          cancelled_rides?: number | null
          completed_rides?: number | null
          completion_rate?: number | null
          created_at?: string | null
          driver_earnings?: number | null
          id?: string
          metadata?: Json | null
          new_users?: number | null
          online_drivers?: number | null
          pending_rides?: number | null
          period_end: string
          period_start: string
          period_type: string
          platform_commission?: number | null
          refunds_issued?: number | null
          top_dropoff_locations?: Json | null
          top_pickup_locations?: Json | null
          total_drivers?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          total_users?: number | null
        }
        Update: {
          active_drivers?: number | null
          active_users?: number | null
          average_rating?: number | null
          average_ride_duration?: number | null
          average_wait_time?: number | null
          cancelled_rides?: number | null
          completed_rides?: number | null
          completion_rate?: number | null
          created_at?: string | null
          driver_earnings?: number | null
          id?: string
          metadata?: Json | null
          new_users?: number | null
          online_drivers?: number | null
          pending_rides?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          platform_commission?: number | null
          refunds_issued?: number | null
          top_dropoff_locations?: Json | null
          top_pickup_locations?: Json | null
          total_drivers?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_schedules: {
        Row: {
          allows_pets: boolean | null
          created_at: string | null
          custom_interval_days: number | null
          day_of_month: number | null
          days_of_week: number[] | null
          description: string | null
          dropoff_location: string
          dropoff_location_lat: number | null
          dropoff_location_lng: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          last_ride_generated_at: string | null
          max_occurrences: number | null
          metadata: Json | null
          next_ride_date: string | null
          passenger_count: number
          paused: boolean | null
          paused_until: string | null
          payment_method: string | null
          payment_method_id: string | null
          pickup_location: string
          pickup_location_lat: number | null
          pickup_location_lng: number | null
          preferred_driver_id: string | null
          recurrence_type: string
          requires_child_seat: boolean | null
          requires_wheelchair: boolean | null
          rides_completed: number | null
          rides_generated: number | null
          schedule_name: string
          scheduled_time: string
          special_instructions: string | null
          start_date: string
          timezone: string | null
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          allows_pets?: boolean | null
          created_at?: string | null
          custom_interval_days?: number | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          dropoff_location: string
          dropoff_location_lat?: number | null
          dropoff_location_lng?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_ride_generated_at?: string | null
          max_occurrences?: number | null
          metadata?: Json | null
          next_ride_date?: string | null
          passenger_count?: number
          paused?: boolean | null
          paused_until?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          pickup_location: string
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          preferred_driver_id?: string | null
          recurrence_type: string
          requires_child_seat?: boolean | null
          requires_wheelchair?: boolean | null
          rides_completed?: number | null
          rides_generated?: number | null
          schedule_name: string
          scheduled_time: string
          special_instructions?: string | null
          start_date: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_type: string
        }
        Update: {
          allows_pets?: boolean | null
          created_at?: string | null
          custom_interval_days?: number | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          dropoff_location?: string
          dropoff_location_lat?: number | null
          dropoff_location_lng?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_ride_generated_at?: string | null
          max_occurrences?: number | null
          metadata?: Json | null
          next_ride_date?: string | null
          passenger_count?: number
          paused?: boolean | null
          paused_until?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          pickup_location?: string
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          preferred_driver_id?: string | null
          recurrence_type?: string
          requires_child_seat?: boolean | null
          requires_wheelchair?: boolean | null
          rides_completed?: number | null
          rides_generated?: number | null
          schedule_name?: string
          scheduled_time?: string
          special_instructions?: string | null
          start_date?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          approved_amount: number | null
          cancellation_id: string | null
          created_at: string | null
          dispute_reason: string | null
          dispute_resolved: boolean | null
          disputed: boolean | null
          id: string
          metadata: Json | null
          original_amount: number
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          processing_method: string | null
          provider_refund_id: string | null
          provider_response: Json | null
          reason: string
          requested_amount: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supporting_documents: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_amount?: number | null
          cancellation_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          dispute_resolved?: boolean | null
          disputed?: boolean | null
          id?: string
          metadata?: Json | null
          original_amount: number
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          processing_method?: string | null
          provider_refund_id?: string | null
          provider_response?: Json | null
          reason: string
          requested_amount: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supporting_documents?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_amount?: number | null
          cancellation_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          dispute_resolved?: boolean | null
          disputed?: boolean | null
          id?: string
          metadata?: Json | null
          original_amount?: number
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          processing_method?: string | null
          provider_refund_id?: string | null
          provider_response?: Json | null
          reason?: string
          requested_amount?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supporting_documents?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      refund_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          initiated_at: string | null
          max_retries: number | null
          payment_id: string
          provider: string | null
          provider_response: Json | null
          provider_status: string | null
          provider_transaction_id: string | null
          refund_method: string
          refund_request_id: string
          retry_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          max_retries?: number | null
          payment_id: string
          provider?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          provider_transaction_id?: string | null
          refund_method: string
          refund_request_id: string
          retry_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          max_retries?: number | null
          payment_id?: string
          provider?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          provider_transaction_id?: string | null
          refund_method?: string
          refund_request_id?: string
          retry_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurant_owners: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_name: string
          business_registration_number: string | null
          contact_person: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          phone_number: string
          tax_id: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name: string
          business_registration_number?: string | null
          contact_person: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          phone_number: string
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name?: string
          business_registration_number?: string | null
          contact_person?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string
          cover_image_url: string | null
          created_at: string
          delivery_time_minutes: number | null
          description: string | null
          id: string
          is_open: boolean | null
          name: string
          owner_id: string
          phone: string
          rating: number | null
          updated_at: string
        }
        Insert: {
          address: string
          cover_image_url?: string | null
          created_at?: string
          delivery_time_minutes?: number | null
          description?: string | null
          id?: string
          is_open?: boolean | null
          name: string
          owner_id: string
          phone: string
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          cover_image_url?: string | null
          created_at?: string
          delivery_time_minutes?: number | null
          description?: string | null
          id?: string
          is_open?: boolean | null
          name?: string
          owner_id?: string
          phone?: string
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ride_bookings: {
        Row: {
          category: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          delivery_handling_fee: number | null
          driver_earnings: number | null
          driver_id: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_location: string
          id: string
          is_delivery: boolean | null
          package_description: string | null
          passenger_count: number | null
          payment_method_id: string | null
          payment_method_type: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string
          price: number | null
          rating: number | null
          recipient_name: string | null
          recipient_phone: string | null
          service_type: string | null
          status: string | null
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          category?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          delivery_handling_fee?: number | null
          driver_earnings?: number | null
          driver_id?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location: string
          id?: string
          is_delivery?: boolean | null
          package_description?: string | null
          passenger_count?: number | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location: string
          price?: number | null
          rating?: number | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          category?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          delivery_handling_fee?: number | null
          driver_earnings?: number | null
          driver_id?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location?: string
          id?: string
          is_delivery?: boolean | null
          package_description?: string | null
          passenger_count?: number | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string
          price?: number | null
          rating?: number | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_bookings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_cancellations: {
        Row: {
          cancellation_fee: number | null
          cancelled_at: string | null
          cancelled_by: string
          cancelled_by_role: string
          created_at: string | null
          fee_calculation_details: Json | null
          fee_charged_to: string | null
          fee_processed: boolean | null
          fee_processed_at: string | null
          id: string
          metadata: Json | null
          original_price: number
          reason_category: string | null
          reason_details: string | null
          refund_amount: number | null
          refund_processed: boolean | null
          refund_processed_at: string | null
          ride_booking_id: string
          scheduled_ride_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_fee?: number | null
          cancelled_at?: string | null
          cancelled_by: string
          cancelled_by_role: string
          created_at?: string | null
          fee_calculation_details?: Json | null
          fee_charged_to?: string | null
          fee_processed?: boolean | null
          fee_processed_at?: string | null
          id?: string
          metadata?: Json | null
          original_price: number
          reason_category?: string | null
          reason_details?: string | null
          refund_amount?: number | null
          refund_processed?: boolean | null
          refund_processed_at?: string | null
          ride_booking_id: string
          scheduled_ride_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_fee?: number | null
          cancelled_at?: string | null
          cancelled_by?: string
          cancelled_by_role?: string
          created_at?: string | null
          fee_calculation_details?: Json | null
          fee_charged_to?: string | null
          fee_processed?: boolean | null
          fee_processed_at?: string | null
          id?: string
          metadata?: Json | null
          original_price?: number
          reason_category?: string | null
          reason_details?: string | null
          refund_amount?: number | null
          refund_processed?: boolean | null
          refund_processed_at?: string | null
          ride_booking_id?: string
          scheduled_ride_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ride_verification_pins: {
        Row: {
          booking_id: string
          created_at: string | null
          driver_id: string | null
          expires_at: string
          id: string
          is_verified: boolean | null
          max_attempts: number | null
          pin_code: string
          pin_type: string | null
          user_id: string
          verification_attempts: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          driver_id?: string | null
          expires_at: string
          id?: string
          is_verified?: boolean | null
          max_attempts?: number | null
          pin_code: string
          pin_type?: string | null
          user_id: string
          verification_attempts?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          driver_id?: string | null
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          max_attempts?: number | null
          pin_code?: string
          pin_type?: string | null
          user_id?: string
          verification_attempts?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      safety_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          admin_notified: boolean | null
          alert_type: string
          booking_id: string | null
          contacts_notified: boolean | null
          created_at: string | null
          emergency_services_notified: boolean | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          message: string | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          service_type: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          admin_notified?: boolean | null
          alert_type: string
          booking_id?: string | null
          contacts_notified?: boolean | null
          created_at?: string | null
          emergency_services_notified?: boolean | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          message?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          service_type?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          admin_notified?: boolean | null
          alert_type?: string
          booking_id?: string | null
          contacts_notified?: boolean | null
          created_at?: string | null
          emergency_services_notified?: boolean | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          message?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          service_type?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safety_check_ins: {
        Row: {
          alert_id: string | null
          alert_triggered: boolean | null
          booking_id: string
          check_in_type: string
          completed_at: string | null
          created_at: string | null
          expected_at: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          response_message: string | null
          service_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          alert_triggered?: boolean | null
          booking_id: string
          check_in_type: string
          completed_at?: string | null
          created_at?: string | null
          expected_at: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          response_message?: string | null
          service_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          alert_triggered?: boolean | null
          booking_id?: string
          check_in_type?: string
          completed_at?: string | null
          created_at?: string | null
          expected_at?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          response_message?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_check_ins_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safety_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_exceptions: {
        Row: {
          action: string
          created_at: string | null
          exception_date: string
          id: string
          modified_dropoff: string | null
          modified_pickup: string | null
          modified_time: string | null
          reason: string | null
          recurring_schedule_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          exception_date: string
          id?: string
          modified_dropoff?: string | null
          modified_pickup?: string | null
          modified_time?: string | null
          reason?: string | null
          recurring_schedule_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          exception_date?: string
          id?: string
          modified_dropoff?: string | null
          modified_pickup?: string | null
          modified_time?: string | null
          reason?: string | null
          recurring_schedule_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_format: string | null
          id: string
          include_charts: boolean | null
          is_active: boolean | null
          last_generated_at: string | null
          metadata: Json | null
          next_generation_at: string | null
          recipient_emails: string[]
          recipient_roles: string[] | null
          report_config: Json | null
          report_name: string
          report_type: string
          schedule_day_of_month: number | null
          schedule_day_of_week: number | null
          schedule_time: string
          schedule_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_format?: string | null
          id?: string
          include_charts?: boolean | null
          is_active?: boolean | null
          last_generated_at?: string | null
          metadata?: Json | null
          next_generation_at?: string | null
          recipient_emails: string[]
          recipient_roles?: string[] | null
          report_config?: Json | null
          report_name: string
          report_type: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time: string
          schedule_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_format?: string | null
          id?: string
          include_charts?: boolean | null
          is_active?: boolean | null
          last_generated_at?: string | null
          metadata?: Json | null
          next_generation_at?: string | null
          recipient_emails?: string[]
          recipient_roles?: string[] | null
          report_config?: Json | null
          report_name?: string
          report_type?: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time?: string
          schedule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_rides: {
        Row: {
          allow_earlier_pickup: boolean | null
          allow_later_pickup: boolean | null
          allows_pets: boolean | null
          cancellation_fee: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          converted_at: string | null
          created_at: string | null
          currency: string | null
          driver_acceptance_deadline: string | null
          driver_assigned_at: string | null
          driver_id: string | null
          driver_notified: boolean | null
          driver_notified_at: string | null
          dropoff_location: string
          dropoff_location_lat: number | null
          dropoff_location_lng: number | null
          estimated_price: number | null
          id: string
          is_recurring: boolean | null
          locked_price: number | null
          luggage_count: number | null
          metadata: Json | null
          passenger_count: number
          payment_id: string | null
          payment_method: string | null
          payment_method_id: string | null
          pickup_location: string
          pickup_location_lat: number | null
          pickup_location_lng: number | null
          prepaid: boolean | null
          price_locked: boolean | null
          recurring_schedule_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          requires_child_seat: boolean | null
          requires_wheelchair: boolean | null
          ride_booking_id: string | null
          scheduled_date: string
          scheduled_datetime: string
          scheduled_time: string
          special_instructions: string | null
          status: string
          time_flexibility_minutes: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          allow_earlier_pickup?: boolean | null
          allow_later_pickup?: boolean | null
          allows_pets?: boolean | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          driver_acceptance_deadline?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notified?: boolean | null
          driver_notified_at?: string | null
          dropoff_location: string
          dropoff_location_lat?: number | null
          dropoff_location_lng?: number | null
          estimated_price?: number | null
          id?: string
          is_recurring?: boolean | null
          locked_price?: number | null
          luggage_count?: number | null
          metadata?: Json | null
          passenger_count?: number
          payment_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          pickup_location: string
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          prepaid?: boolean | null
          price_locked?: boolean | null
          recurring_schedule_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          requires_child_seat?: boolean | null
          requires_wheelchair?: boolean | null
          ride_booking_id?: string | null
          scheduled_date: string
          scheduled_datetime: string
          scheduled_time: string
          special_instructions?: string | null
          status?: string
          time_flexibility_minutes?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_type: string
        }
        Update: {
          allow_earlier_pickup?: boolean | null
          allow_later_pickup?: boolean | null
          allows_pets?: boolean | null
          cancellation_fee?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          driver_acceptance_deadline?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notified?: boolean | null
          driver_notified_at?: string | null
          dropoff_location?: string
          dropoff_location_lat?: number | null
          dropoff_location_lng?: number | null
          estimated_price?: number | null
          id?: string
          is_recurring?: boolean | null
          locked_price?: number | null
          luggage_count?: number | null
          metadata?: Json | null
          passenger_count?: number
          payment_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          pickup_location?: string
          pickup_location_lat?: number | null
          pickup_location_lng?: number | null
          prepaid?: boolean | null
          price_locked?: boolean | null
          recurring_schedule_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          requires_child_seat?: boolean | null
          requires_wheelchair?: boolean | null
          ride_booking_id?: string | null
          scheduled_date?: string
          scheduled_datetime?: string
          scheduled_time?: string
          special_instructions?: string | null
          status?: string
          time_flexibility_minutes?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          default_value: Json | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
          validation_rules: Json | null
          value_type: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: Json | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
          validation_rules?: Json | null
          value_type?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: Json | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          setting_category?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
          validation_rules?: Json | null
          value_type?: string | null
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          adults: number
          booking_date: string
          children: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_status: string | null
          provider_id: string | null
          special_requests: string | null
          start_time: string
          status: string
          total_price: number
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adults?: number
          booking_date: string
          children?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_status?: string | null
          provider_id?: string | null
          special_requests?: string | null
          start_time: string
          status?: string
          total_price: number
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adults?: number
          booking_date?: string
          children?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_status?: string | null
          provider_id?: string | null
          special_requests?: string | null
          start_time?: string
          status?: string
          total_price?: number
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "tour_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operator_applications: {
        Row: {
          created_at: string | null
          current_step: number | null
          id: string
          operator_id: string
          reviewed_at: string | null
          status: string
          step_1_data: Json | null
          step_2_data: Json | null
          step_3_data: Json | null
          step_4_data: Json | null
          step_5_data: Json | null
          submitted_at: string | null
          total_steps: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          operator_id: string
          reviewed_at?: string | null
          status?: string
          step_1_data?: Json | null
          step_2_data?: Json | null
          step_3_data?: Json | null
          step_4_data?: Json | null
          step_5_data?: Json | null
          submitted_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          operator_id?: string
          reviewed_at?: string | null
          status?: string
          step_1_data?: Json | null
          step_2_data?: Json | null
          step_3_data?: Json | null
          step_4_data?: Json | null
          step_5_data?: Json | null
          submitted_at?: string | null
          total_steps?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_operator_applications_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operators: {
        Row: {
          address: string
          admin_notes: string | null
          application_status: string | null
          average_rating: number | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          business_license_url: string | null
          business_name: string
          business_registration_number: string | null
          business_type: string
          certifications: string[] | null
          contact_person: string
          created_at: string | null
          description: string | null
          email: string
          id: string
          id_document_url: string | null
          insurance_certificate_url: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_active: boolean | null
          island: string
          languages_spoken: string[] | null
          number_of_employees: number | null
          phone_number: string
          profile_photo_url: string | null
          province: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tax_identification_number: string | null
          total_bookings: number | null
          total_reviews: number | null
          tour_categories: string[] | null
          tourism_license_expiry: string | null
          tourism_license_number: string | null
          tourism_license_url: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          website: string | null
          whatsapp_number: string | null
          years_in_operation: number | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          application_status?: string | null
          average_rating?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_license_url?: string | null
          business_name: string
          business_registration_number?: string | null
          business_type: string
          certifications?: string[] | null
          contact_person: string
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          id_document_url?: string | null
          insurance_certificate_url?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          island: string
          languages_spoken?: string[] | null
          number_of_employees?: number | null
          phone_number: string
          profile_photo_url?: string | null
          province?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tax_identification_number?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          tour_categories?: string[] | null
          tourism_license_expiry?: string | null
          tourism_license_number?: string | null
          tourism_license_url?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          website?: string | null
          whatsapp_number?: string | null
          years_in_operation?: number | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          application_status?: string | null
          average_rating?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_license_url?: string | null
          business_name?: string
          business_registration_number?: string | null
          business_type?: string
          certifications?: string[] | null
          contact_person?: string
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          id_document_url?: string | null
          insurance_certificate_url?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          island?: string
          languages_spoken?: string[] | null
          number_of_employees?: number | null
          phone_number?: string
          profile_photo_url?: string | null
          province?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tax_identification_number?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          tour_categories?: string[] | null
          tourism_license_expiry?: string | null
          tourism_license_number?: string | null
          tourism_license_url?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          website?: string | null
          whatsapp_number?: string | null
          years_in_operation?: number | null
        }
        Relationships: []
      }
      tour_providers: {
        Row: {
          average_rating: number | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_name: string
          business_registration_number: string | null
          contact_person: string
          created_at: string | null
          description: string | null
          email: string
          id: string
          is_active: boolean | null
          phone_number: string
          tax_id: string | null
          total_bookings: number | null
          total_revenue: number | null
          total_tours: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          average_rating?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name: string
          business_registration_number?: string | null
          contact_person: string
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          phone_number: string
          tax_id?: string | null
          total_bookings?: number | null
          total_revenue?: number | null
          total_tours?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          average_rating?: number | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name?: string
          business_registration_number?: string | null
          contact_person?: string
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string
          tax_id?: string | null
          total_bookings?: number | null
          total_revenue?: number | null
          total_tours?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      tour_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          photo_urls: string[] | null
          rating: number
          title: string | null
          tour_id: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          photo_urls?: string[] | null
          rating: number
          title?: string | null
          tour_id: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          photo_urls?: string[] | null
          rating?: number
          title?: string | null
          tour_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          approval_status: string | null
          available_days: string[] | null
          category: string
          created_at: string | null
          currency: string | null
          description: string
          difficulty_level: string | null
          duration_hours: number
          excludes: string[] | null
          gallery_urls: string[] | null
          highlights: string[] | null
          id: string
          image_url: string | null
          includes: string[] | null
          is_active: boolean | null
          island: string | null
          latitude: number | null
          location: string
          longitude: number | null
          max_group_size: number | null
          min_age: number | null
          name: string
          operator_id: string | null
          price_adult: number
          price_child: number | null
          provider_id: string | null
          provider_name: string | null
          rating: number | null
          review_count: number | null
          short_description: string | null
          start_times: string[] | null
          updated_at: string | null
          what_to_bring: string[] | null
        }
        Insert: {
          approval_status?: string | null
          available_days?: string[] | null
          category: string
          created_at?: string | null
          currency?: string | null
          description: string
          difficulty_level?: string | null
          duration_hours: number
          excludes?: string[] | null
          gallery_urls?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean | null
          island?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_group_size?: number | null
          min_age?: number | null
          name: string
          operator_id?: string | null
          price_adult: number
          price_child?: number | null
          provider_id?: string | null
          provider_name?: string | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          start_times?: string[] | null
          updated_at?: string | null
          what_to_bring?: string[] | null
        }
        Update: {
          approval_status?: string | null
          available_days?: string[] | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          difficulty_level?: string | null
          duration_hours?: number
          excludes?: string[] | null
          gallery_urls?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean | null
          island?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_group_size?: number | null
          min_age?: number | null
          name?: string
          operator_id?: string | null
          price_adult?: number
          price_child?: number | null
          provider_id?: string | null
          provider_name?: string | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          start_times?: string[] | null
          updated_at?: string | null
          what_to_bring?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "tour_operators"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          category: string | null
          created_at: string
          currency: string
          description: string
          id: string
          metadata: Json | null
          payment_method: string | null
          reference_id: string | null
          related_booking_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          category?: string | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference_id?: string | null
          related_booking_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference_id?: string | null
          related_booking_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_shares: {
        Row: {
          accessed_count: number | null
          auto_share: boolean | null
          booking_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          service_type: string
          share_token: string
          share_url: string
          shared_with_contacts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accessed_count?: number | null
          auto_share?: boolean | null
          booking_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_type: string
          share_token: string
          share_url: string
          shared_with_contacts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accessed_count?: number | null
          auto_share?: boolean | null
          booking_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_type?: string
          share_token?: string
          share_url?: string
          shared_with_contacts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_bislama_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bislama_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "bislama_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bislama_progress: {
        Row: {
          created_at: string | null
          current_level: string
          current_streak: number
          id: string
          last_practice_date: string | null
          lessons_completed: number
          longest_streak: number
          total_xp: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          lessons_completed?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          attempts: number
          best_score: number
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string | null
          score: number
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          score?: number
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          score?: number
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "bislama_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_accessibility_features: {
        Row: {
          accessibility_certification: string[] | null
          child_seat_type: string[] | null
          created_at: string | null
          driver_id: string | null
          extra_legroom: boolean | null
          has_audio_announcements: boolean | null
          has_booster_seat: boolean | null
          has_braille_signage: boolean | null
          has_child_seat: boolean | null
          has_grab_bars: boolean | null
          has_lift: boolean | null
          has_low_floor: boolean | null
          has_pet_restraints: boolean | null
          has_ramp: boolean | null
          has_step_stool: boolean | null
          has_swivel_seat: boolean | null
          has_visual_alerts: boolean | null
          has_wheelchair_restraints: boolean | null
          has_wide_doors: boolean | null
          id: string
          inspection_date: string | null
          inspection_valid_until: string | null
          is_active: boolean | null
          metadata: Json | null
          service_animal_friendly: boolean | null
          spacious_interior: boolean | null
          updated_at: string | null
          vehicle_id: string
          wheelchair_accessible: boolean | null
          wheelchair_capacity: number | null
        }
        Insert: {
          accessibility_certification?: string[] | null
          child_seat_type?: string[] | null
          created_at?: string | null
          driver_id?: string | null
          extra_legroom?: boolean | null
          has_audio_announcements?: boolean | null
          has_booster_seat?: boolean | null
          has_braille_signage?: boolean | null
          has_child_seat?: boolean | null
          has_grab_bars?: boolean | null
          has_lift?: boolean | null
          has_low_floor?: boolean | null
          has_pet_restraints?: boolean | null
          has_ramp?: boolean | null
          has_step_stool?: boolean | null
          has_swivel_seat?: boolean | null
          has_visual_alerts?: boolean | null
          has_wheelchair_restraints?: boolean | null
          has_wide_doors?: boolean | null
          id?: string
          inspection_date?: string | null
          inspection_valid_until?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          service_animal_friendly?: boolean | null
          spacious_interior?: boolean | null
          updated_at?: string | null
          vehicle_id: string
          wheelchair_accessible?: boolean | null
          wheelchair_capacity?: number | null
        }
        Update: {
          accessibility_certification?: string[] | null
          child_seat_type?: string[] | null
          created_at?: string | null
          driver_id?: string | null
          extra_legroom?: boolean | null
          has_audio_announcements?: boolean | null
          has_booster_seat?: boolean | null
          has_braille_signage?: boolean | null
          has_child_seat?: boolean | null
          has_grab_bars?: boolean | null
          has_lift?: boolean | null
          has_low_floor?: boolean | null
          has_pet_restraints?: boolean | null
          has_ramp?: boolean | null
          has_step_stool?: boolean | null
          has_swivel_seat?: boolean | null
          has_visual_alerts?: boolean | null
          has_wheelchair_restraints?: boolean | null
          has_wide_doors?: boolean | null
          id?: string
          inspection_date?: string | null
          inspection_valid_until?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          service_animal_friendly?: boolean | null
          spacious_interior?: boolean | null
          updated_at?: string | null
          vehicle_id?: string
          wheelchair_accessible?: boolean | null
          wheelchair_capacity?: number | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_aud: number
          balance_usd: number
          balance_vvu: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_aud?: number
          balance_usd?: number
          balance_vvu?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_aud?: number
          balance_usd?: number
          balance_vvu?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      approve_driver_application: {
        Args: { p_admin_user_id: string; p_driver_id: string; p_notes?: string }
        Returns: boolean
      }
      calculate_cancellation_fee: {
        Args: {
          p_cancelled_by_role: string
          p_original_price: number
          p_ride_booking_id: string
          p_ride_status: string
        }
        Returns: {
          calculation_details: Json
          fee_amount: number
          fee_charged_to: string
          refund_amount: number
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_nearby_drivers: {
        Args: {
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_meters?: number
          p_vehicle_type?: string
        }
        Returns: {
          distance_meters: number
          driver_id: string
          driver_name: string
          latitude: number
          longitude: number
          rating: number
          vehicle_type: string
        }[]
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_dashboard_stats: {
        Args: { p_period?: string }
        Returns: {
          active_drivers: number
          active_safety_alerts: number
          cancelled_rides: number
          completed_rides: number
          pending_driver_applications: number
          pending_refunds: number
          total_drivers: number
          total_revenue: number
          total_rides: number
          total_users: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: {
        Args: { listing_id: string }
        Returns: undefined
      }
      log_admin_activity: {
        Args: {
          p_action_category: string
          p_action_type: string
          p_admin_user_id: string
          p_changes_made?: Json
          p_description: string
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      reject_driver_application: {
        Args: { p_admin_user_id: string; p_driver_id: string; p_reason: string }
        Returns: boolean
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "restaurant_owner" | "user"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "driver", "restaurant_owner", "user"],
    },
  },
} as const
