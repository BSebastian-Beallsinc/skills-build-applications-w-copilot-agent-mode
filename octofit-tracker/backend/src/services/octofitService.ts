import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = (input ?? {}) as Record<string, unknown>;
  if (typeof userId !== 'string' || !isValidObjectId(userId)) throw httpError(400, 'userId must be a valid id');
  if (typeof teamId !== 'string' || !isValidObjectId(teamId)) throw httpError(400, 'teamId must be a valid id');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'minutes must be a number of at least 1');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const { name, mascot, members = [] } = (input ?? {}) as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'mascot is required');
  if (!Array.isArray(members) || !members.every((id) => typeof id === 'string' && isValidObjectId(id))) {
    throw httpError(400, 'members must be an array of valid user ids');
  }
  const memberIds = [...new Set(members as string[])];
  if (memberIds.length && (await User.countDocuments({ _id: { $in: memberIds } })) !== memberIds.length) {
    throw httpError(404, 'One or more members were not found');
  }
  if (await Team.exists({ name: name.trim() })) throw httpError(409, 'A team with that name already exists');

  const team = await Team.create({ name, mascot, members: memberIds });
  if (memberIds.length) {
    // Moving a user to this team removes them from their previous team.
    await Team.updateMany({ _id: { $ne: team._id } }, { $pull: { members: { $in: memberIds } } });
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: unknown; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const pointsByTeam = new Map(totals.map((total) => [String(total._id), total.totalPoints]));
  const teams = await Team.find().lean();
  return teams
    .map((team) => ({ teamId: team._id, teamName: team.name, mascot: team.mascot, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

const strengthTypes = new Set(['strength', 'weights', 'lifting']);

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const minutesByType = new Map<string, number>();
  for (const activity of await Activity.find({ user: user._id }).lean()) {
    const type = activity.type.toLowerCase();
    minutesByType.set(type, (minutesByType.get(type) ?? 0) + activity.minutes);
  }
  const [topType] = [...minutesByType.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  const focus = topType ? (strengthTypes.has(topType) ? 'strength' : 'endurance') : user.fitnessGoal;
  const reason = topType ? `Matches your recent ${topType} activity (${focus})` : `Matches your ${focus} fitness goal`;
  const workouts = await Workout.find({ focus }).limit(3).lean();
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
