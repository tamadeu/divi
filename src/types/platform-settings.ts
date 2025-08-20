export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: 'text' | 'boolean' | 'number' | 'json' | 'file';
  description: string | null;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingsGroup {
  category: string;
  title: string;
  description: string;
  settings: PlatformSetting[];
}