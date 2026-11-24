import { endpoints, getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  return <CapabilityCard<{ activities: Activity[] }> title="Activities" description="Track student activity minutes and points." load={getJson} path={endpoints.activities} emptyMessage="No activities logged yet." select={(d) => d.activities} renderItem={(a: Activity) => `${a.type}: ${a.minutes} minutes, ${a.points} points`} />;
}
