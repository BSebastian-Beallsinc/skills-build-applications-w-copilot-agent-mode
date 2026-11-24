import { endpoints, getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

// No authentication in this exercise, so a demo user stands in for the signed-in student.
const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  return <CapabilityCard<{ suggestions: Suggestion[] }> title="Workout suggestions" description="Recommend workouts from activity patterns." load={getJson} path={endpoints.workoutSuggestions(demoUserEmail)} emptyMessage="No workout suggestions yet." select={(d) => d.suggestions} renderItem={(s: Suggestion) => <><strong>{s.title}</strong> — {s.reason}</>} />;
}
