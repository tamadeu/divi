import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlatformSettingsGroup } from '@/types/platform-settings';
import SettingField from './SettingField';

interface SettingsGroupProps {
  group: PlatformSettingsGroup;
  onUpdateSetting: (key: string, value: string) => Promise<boolean>;
}

const SettingsGroup = ({ group, onUpdateSetting }: SettingsGroupProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {group.title}
        </CardTitle>
        <CardDescription>
          {group.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {group.settings.map((setting) => (
          <SettingField
            key={setting.id}
            setting={setting}
            onUpdate={onUpdateSetting}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default SettingsGroup;