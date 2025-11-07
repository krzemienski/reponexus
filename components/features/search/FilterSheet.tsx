import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';

interface FilterOptions {
  language?: string;
  minStars?: number;
  maxStars?: number;
  minForks?: number;
  topics?: string[];
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const POPULAR_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'C#',
];

const STAR_RANGES = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '10+', min: 10, max: undefined },
  { label: '100+', min: 100, max: undefined },
  { label: '1K+', min: 1000, max: undefined },
  { label: '10K+', min: 10000, max: undefined },
  { label: '50K+', min: 50000, max: undefined },
];

export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [language, setLanguage] = useState(initialFilters.language);
  const [minStars, setMinStars] = useState(initialFilters.minStars);
  const [maxStars, setMaxStars] = useState(initialFilters.maxStars);
  const [minForks, setMinForks] = useState(initialFilters.minForks);

  const handleReset = () => {
    setLanguage(undefined);
    setMinStars(undefined);
    setMaxStars(undefined);
    setMinForks(undefined);
  };

  const handleApply = () => {
    onApply({
      language,
      minStars,
      maxStars,
      minForks,
    });
    onClose();
  };

  const handleStarRangeSelect = (min?: number, max?: number) => {
    setMinStars(min);
    setMaxStars(max);
  };

  const getSelectedStarRange = () => {
    return STAR_RANGES.find(
      (range) => range.min === minStars && range.max === maxStars
    );
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ScrollView className="px-6">
        <Text variant="title" weight="bold" className="mb-6">
          Filter Repositories
        </Text>

        {/* Language Filter */}
        <View className="mb-6">
          <Text variant="body" weight="semibold" className="mb-3">
            Language
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {POPULAR_LANGUAGES.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                selected={language === lang}
                onPress={() =>
                  setLanguage(language === lang ? undefined : lang)
                }
              />
            ))}
          </View>
        </View>

        {/* Stars Filter */}
        <View className="mb-6">
          <Text variant="body" weight="semibold" className="mb-3">
            Stars
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STAR_RANGES.map((range) => (
              <Chip
                key={range.label}
                label={range.label}
                selected={getSelectedStarRange()?.label === range.label}
                onPress={() => handleStarRangeSelect(range.min, range.max)}
              />
            ))}
          </View>
        </View>

        {/* Min Forks Filter */}
        <View className="mb-6">
          <Text variant="body" weight="semibold" className="mb-3">
            Minimum Forks
          </Text>
          <Input
            value={minForks?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text);
              setMinForks(isNaN(num) ? undefined : num);
            }}
            keyboardType="number-pad"
            placeholder="e.g., 100"
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-6">
          <View className="flex-1">
            <Button variant="outline" onPress={handleReset}>
              Reset
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="primary" onPress={handleApply}>
              Apply Filters
            </Button>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default FilterSheet;
