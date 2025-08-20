import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlatformSetting } from '@/types/platform-settings';
import { Check, X, Upload, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface SettingFieldProps {
  setting: PlatformSetting;
  onUpdate: (key: string, value: string) => Promise<boolean>;
}

const SettingField = ({ setting, onUpdate }: SettingFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(setting.setting_value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(setting.setting_key, value);
    if (success) {
      setIsEditing(false);
      showSuccess('Configuração atualizada com sucesso!');
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setValue(setting.setting_value || '');
    setIsEditing(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type based on setting
    const isLogo = setting.setting_key.includes('logo');
    const isFavicon = setting.setting_key.includes('favicon');
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (isFavicon) {
      allowedTypes.push('image/x-icon', 'image/vnd.microsoft.icon');
    }

    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não suportado.');
      return;
    }

    // Validate file size (5MB for logos, 1MB for favicons)
    const maxSize = isFavicon ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(`Arquivo muito grande. Tamanho máximo: ${isFavicon ? '1MB' : '5MB'}.`);
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${setting.setting_key}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('platform-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(data.path);

      setValue(publicUrl);
      
      // Auto-save file uploads
      const success = await onUpdate(setting.setting_key, publicUrl);
      if (success) {
        showSuccess('Arquivo enviado e configuração atualizada!');
      }
    } catch (error: any) {
      showError('Erro ao fazer upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const renderField = () => {
    if (!isEditing && setting.setting_type !== 'boolean') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {setting.setting_type === 'file' && value ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Arquivo atual:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(value, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver arquivo
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {value || 'Não configurado'}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
          </div>
        </div>
      );
    }

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => {
                const newValue = checked.toString();
                setValue(newValue);
                onUpdate(setting.setting_key, newValue);
              }}
            />
            <span className="text-sm">
              {value === 'true' ? 'Habilitado' : 'Desabilitado'}
            </span>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept={setting.setting_key.includes('favicon') 
                  ? 'image/*,.ico' 
                  : 'image/jpeg,image/png,image/webp,image/svg+xml'
                }
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              {isUploading && (
                <Upload className="h-4 w-4 animate-spin" />
              )}
            </div>
            
            {value && (
              <div className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ou cole uma URL..."
                  className="flex-1"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {setting.description && setting.description.length > 100 ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={setting.description}
                rows={3}
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={setting.description || ''}
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {setting.description || setting.setting_key}
      </Label>
      {renderField()}
    </div>
  );
};

export default SettingField;