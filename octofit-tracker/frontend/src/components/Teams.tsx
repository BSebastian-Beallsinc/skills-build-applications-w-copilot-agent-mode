import { endpoints, getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  return <CapabilityCard<{ teams: Team[] }> title="Teams" description="Manage teams and members." load={(path) => getJson<any>(path)} path={endpoints.teams} emptyMessage="No teams found." select={(d) => d.teams} renderItem={(t: Team) => <><strong>{t.name}</strong> — {t.members.length} {t.members.length === 1 ? "member" : "members"}</>} />;
}
