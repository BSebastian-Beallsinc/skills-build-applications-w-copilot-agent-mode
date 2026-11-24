import { endpoints, getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<{ leaderboard: Entry[] }> title="Leaderboard" description="Compare team point totals." load={getJson} path={endpoints.leaderboard} emptyMessage="No leaderboard rankings yet." select={(d) => d.leaderboard} renderItem={(e: Entry) => `#${e.rank} ${e.teamName}: ${e.totalPoints} points`} />;
}
