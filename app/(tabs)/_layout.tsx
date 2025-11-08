import { Tabs } from 'expo-router';
import { View } from 'react-native';

// TODO: Import icons
const TabBarIcon = ({ focused, name }: { focused: boolean; name: string }) => {
  return (
    <View
      className={`w-6 h-6 rounded-full ${focused ? 'bg-primary-500' : 'bg-dark-400'}`}
    />
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
        },
      }}
    >
      <Tabs.Screen
        name="topics"
        options={{
          title: 'Topics',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="home" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="trending" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="profile" />,
        }}
      />
    </Tabs>
  );
}
