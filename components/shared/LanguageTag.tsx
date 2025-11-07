import React from 'react';
import { View } from 'react-native';
import { Badge } from '@/components/ui/Badge';

interface LanguageTagProps {
  language: string;
  size?: 'sm' | 'md' | 'lg';
}

// Language color mapping
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  Ruby: '#cc342d',
  PHP: '#777bb4',
  Swift: '#ffac45',
  Kotlin: '#a97bff',
  'C#': '#178600',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dart: '#00b4ab',
  Scala: '#c22d40',
  Objective: '#438eff',
  Perl: '#0298c3',
  Haskell: '#5e5086',
};

export const LanguageTag: React.FC<LanguageTagProps> = ({
  language,
  size = 'sm',
}) => {
  const color = LANGUAGE_COLORS[language] || '#71717a';

  return (
    <View className="flex-row items-center">
      <View
        className="w-3 h-3 rounded-full mr-2"
        style={{ backgroundColor: color }}
      />
      <Badge variant="default" size={size}>
        {language}
      </Badge>
    </View>
  );
};

export default LanguageTag;
