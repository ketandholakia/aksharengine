import { Download, Trash2 } from 'lucide-react';
import { downloadJson } from '@/utils/exporter';
import type { FontProfile } from '@/types/profile.types';

interface ProfileListProps {
  profiles: FontProfile[];
  onDelete: (id: string) => void;
  onSelect: (profile: FontProfile) => void;
}

export function ProfileList({ profiles, onDelete, onSelect }: ProfileListProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Language</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Version</th>
            <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {profiles.map((profile) => (
            <tr key={profile.id} className="hover:bg-slate-50">
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onSelect(profile)}
                  className="text-brand-700 hover:underline font-medium"
                >
                  {profile.name}
                </button>
              </td>
              <td className="px-4 py-2 capitalize">{profile.language}</td>
              <td className="px-4 py-2">{profile.version}</td>
              <td className="px-4 py-2 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadJson(`${profile.id}.json`, profile)}
                    className="text-slate-500 hover:text-brand-600"
                    title="Export"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(profile.id)}
                    className="text-slate-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                No profiles available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
