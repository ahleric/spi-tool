import dayjs from "dayjs";
import type { EventLog } from "@prisma/client";

export function EventTable({ events }: { events: EventLog[] }) {
  if (!events.length) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-slate-400">
        暂无事件记录
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-500/15 bg-neutral-900/70">
      <table className="w-full text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-6 py-3">时间</th>
            <th className="px-6 py-3">类型</th>
            <th className="px-6 py-3">艺人</th>
            <th className="px-6 py-3">单曲</th>
            <th className="px-6 py-3">IP</th>
            <th className="px-6 py-3">User Agent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.map((event) => (
            <tr key={event.id} className="transition hover:bg-white/5">
              <td className="px-6 py-4 text-slate-400">
                {dayjs(event.createdAt).format("YYYY/MM/DD HH:mm")}
              </td>
              <td className="px-6 py-4 font-semibold">{event.type}</td>
              <td className="px-6 py-4 text-slate-300">
                {event.artistName ? (
                  <div>
                    <div className="font-medium">{event.artistName}</div>
                    {event.artistId && (
                      <div className="text-xs text-slate-500">{event.artistId}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-slate-300">
                {event.trackName ? (
                  <div>
                    <div className="font-medium">{event.trackName}</div>
                    {event.trackId && (
                      <div className="text-xs text-slate-500">{event.trackId}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                {event.ip || "-"}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                {event.userAgent || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
