import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../../utils/apiRequest.ts';
import Header from '../../../../components/Header/Header.tsx';
import styles from './GroupStage.module.scss';
import tournamentStyles from '../../TournamentPage.module.scss';

// === API СТРУКТУРЫ ===
interface Participant {
  id: number;
  user_id: number;
  partner_id: number | null;
  confirmed?: boolean;
}

interface Group {
  id: number;
  number: number;
  name: string;
  tournament_id: number;
  created_at?: string;
}

interface GroupParticipantLink {
  id?: number;
  group_id: number;
  participant_id: number;
}

interface Match {
  id: number;
  group_id: number;
  participant1_id: number;
  participant2_id: number;
  score1: number | null;
  score2: number | null;
  played: boolean;
}

// === ВНУТРЕННИЕ СТРУКТУРЫ ===
interface Player {
  id: number;
  /** Фамилия(и) + очки игрока(ов) */
  displayName: string;
  /** Суммарные очки (для возможной сортировки) – сейчас не используется в таблице */
  totalScore: number;
}

interface PlayerWithStats extends Player {
  position: number;
  points: number;          // очки, набранные в матчах группы
  scores: Map<number, string>;
  matchIdMap: Map<number, number>;
}

interface GroupWithTable {
  id: number;
  number: number;
  name: string;
  players: PlayerWithStats[];
}

interface EditingCell {
  groupId: number;
  matchId: number;
  player1: number;
  player2: number;
  participant1_id: number;
  participant2_id: number;
  rowIndex: number;
  colIndex: number;
}

const GroupStage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === ПРОВЕРКА РОЛИ ===
  const checkUserRole = async () => {
    if (!tournamentId) return;
    try {
      const user = await apiRequest('users/me', 'GET', undefined, true);
      const tournament = await apiRequest(`tournaments/${tournamentId}`, 'GET', undefined, false);
      setIsOrganizer(user?.id === tournament.owner_id);
    } catch (error) {
      console.error('Ошибка проверки роли:', error);
      setIsOrganizer(false);
    }
  };

  // === 1. УЧАСТНИКИ + ПОЛЬЗОВАТЕЛИ ===
  const fetchParticipantsAndUsers = async (): Promise<Map<number, Player>> => {
    if (!tournamentId) return new Map();

    try {
      const resp = await apiRequest(`tournaments/${tournamentId}/participants`, 'GET', undefined, false);
      const participants: Participant[] = resp?.data ?? [];

      const userIds = new Set<number>();
      participants.forEach(p => {
        if (p.user_id) userIds.add(p.user_id);
        if (p.partner_id) userIds.add(p.partner_id);
      });

      const users = await Promise.all(
        Array.from(userIds).map(async (id) => {
          try {
            const user = await apiRequest(`users/${id}`, 'GET', undefined, false);
            return [id, user] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      const usersMap = new Map(users.filter(([, u]) => u !== null));

      const playersMap = new Map<number, Player>();

      participants.forEach(p => {
        const mainUser = usersMap.get(p.user_id);
        if (!mainUser) return;

        // ----- ОДИНОЧНЫЙ ИГРОК -----
        const mainScore = Number(mainUser.score) || 0;
        let displayName = `${mainUser.surname || mainUser.name} (${mainScore})`;
        let totalScore = mainScore;

        // ----- ПАРА -----
        if (p.partner_id) {
          const partnerUser = usersMap.get(p.partner_id);
          if (partnerUser) {
            const partnerScore = Number(partnerUser.score) || 0;
            displayName = `${mainUser.surname}/${partnerUser.surname} (${mainScore}/${partnerScore})`;
            totalScore += partnerScore;
          }
        }

        playersMap.set(p.id, {
          id: p.id,
          displayName,
          totalScore,
        });
      });

      return playersMap;
    } catch (e) {
      console.error('Ошибка загрузки участников:', e);
      return new Map();
    }
  };

  // === 2. ГРУППА — ПОДСЧЁТ ТАБЛИЦЫ ===
  const fetchGroupTable = async (
    group: Group,
    allPlayers: Map<number, Player>
  ): Promise<GroupWithTable> => {
    try {
      const linksResp = await apiRequest(`groups/${group.id}/participants`, 'GET', undefined, false);
      const links: GroupParticipantLink[] = Array.isArray(linksResp) ? linksResp : linksResp?.data ?? [];
      const orderedIds = links.map(l => l.participant_id);

      const groupPlayers = orderedIds
        .map(id => allPlayers.get(id))
        .filter((p): p is Player => p !== null);

      const matchesResp = await apiRequest(`groups/${group.id}/matches`, 'GET', undefined, false);
      const matches: Match[] = Array.isArray(matchesResp) ? matchesResp : matchesResp?.data ?? [];

      const stats = new Map<number, {
        player: Player;
        points: number;
        scores: Map<number, string>;
        matchIdMap: Map<number, number>;
      }>();

      groupPlayers.forEach(p => {
        stats.set(p.id, {
          player: p,
          points: 0,
          scores: new Map(),
          matchIdMap: new Map(),
        });
      });

      matches.forEach(m => {
        const p1 = m.participant1_id;
        const p2 = m.participant2_id;
        const s1 = m.score1;
        const s2 = m.score2;

        const stat1 = stats.get(p1);
        const stat2 = stats.get(p2);
        if (!stat1 || !stat2) return;

        stat1.scores.set(p2, s1 != null && s2 != null ? `${s1}/${s2}` : '');
        stat1.matchIdMap.set(p2, m.id);

        stat2.scores.set(p1, s1 != null && s2 != null ? `${s2}/${s1}` : '');
        stat2.matchIdMap.set(p1, m.id);

        if (s1 != null && s2 != null) {
          if (s1 > s2) stat1.points += 1;
          else if (s1 < s2) stat2.points += 1;
        }
      });

      // === ДОРАБОТАННЫЙ ПОДСЧЁТ МЕСТ ===
      const extendedStats = groupPlayers.map(p => {
        const s = stats.get(p.id)!;

        let scored = 0;
        let conceded = 0;

        s.scores.forEach(scoreStr => {
          if (!scoreStr) return;
          const [sf, sa] = scoreStr.split('/').map(Number);
          if (!isNaN(sf) && !isNaN(sa)) {
            scored += sf;
            conceded += sa;
          }
        });

        const scoreDiff = scored - conceded;

        return {
          ...p,
          points: s.points,
          scores: s.scores,
          matchIdMap: s.matchIdMap,
          scored,
          conceded,
          scoreDiff,
        };
      });

      // сортировка: очки → разница → забитые → id
      const sortedForPos = [...extendedStats].sort((a, b) =>
        b.points - a.points ||
        b.scoreDiff - a.scoreDiff ||
        b.scored - a.scored ||
        a.id - b.id
      );

      // уникальные места (1, 2, 3, ...)
      const posMap = new Map<number, number>();
      sortedForPos.forEach((p, i) => posMap.set(p.id, i + 1));

      const finalPlayers: PlayerWithStats[] = extendedStats.map(p => ({
        ...p,
        position: posMap.get(p.id)!,
      }));

      return { ...group, players: finalPlayers };
    } catch (err) {
      console.error(`Группа ${group.id} ошибка:`, err);
      return { ...group, players: [] };
    }
  };

  // === 3. ПОЛНАЯ ЗАГРУЗКА ===
  const fetchGroups = async () => {
    if (!tournamentId) return;
    setLoading(true);

    try {
      const allPlayers = await fetchParticipantsAndUsers();
      const groupsResp = await apiRequest(`groups/tournament/${tournamentId}`, 'GET', undefined, false);
      const groups: Group[] = Array.isArray(groupsResp) ? groupsResp : groupsResp?.data ?? [];

      const tables = await Promise.all(groups.map(g => fetchGroupTable(g, allPlayers)));
      setGroups(tables);
    } catch (e) {
      console.error('Ошибка загрузки групп:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // === РЕДАКТИРОВАНИЕ ===
  const handleCellClick = async (
    groupId: number,
    player1: PlayerWithStats,
    player2: PlayerWithStats,
    rowIndex: number,
    colIndex: number
  ) => {
    if (!isOrganizer) return;
    const matchId = player1.matchIdMap.get(player2.id);
    if (!matchId) return;

    try {
      const match = await apiRequest(`groups/matches/${matchId}`, 'GET', undefined, false);
      setEditingCell({
        groupId,
        matchId,
        player1: player1.id,
        player2: player2.id,
        participant1_id: match.participant1_id,
        participant2_id: match.participant2_id,
        rowIndex,
        colIndex,
      });
    } catch (err) {
      console.error('Ошибка загрузки матча:', err);
    }
  };

  // === СОХРАНЕНИЕ СЧЁТА ===
  const handleScoreSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !editingCell || !inputRef.current) return;

    const val = inputRef.current.value.trim();
    if (!val.includes('/')) return;

    const [s1s, s2s] = val.split('/');
    const s1 = parseInt(s1s, 10);
    const s2 = parseInt(s2s, 10);
    if (isNaN(s1) || isNaN(s2)) return;

    try {
      let score1: number;
      let score2: number;

      if (editingCell.rowIndex > editingCell.colIndex) {
        score1 = s2;
        score2 = s1;
      } else {
        score1 = s1;
        score2 = s2;
      }

      await apiRequest(
        `groups/matches/${editingCell.matchId}`,
        'PUT',
        { score1, score2, played: true },
        true
      );

      await fetchGroups();
      setEditingCell(null);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    checkUserRole();
    fetchGroups();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className={tournamentStyles.loaderContainer}>
        <div className={tournamentStyles.loader} />
        <p>Загрузка таблицы...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={tournamentStyles.pageWrapper}>
        <Header scrollToBenefits={() => {}} />
        <main className={tournamentStyles.mainContent}>
          <div className={styles.tournamentContainer}>
            <div className={styles.contentWrapper}>
              <h1 className={tournamentStyles.tournamentName}>Группы</h1>
              <p className={styles.emptyMessage}>Группы не сформированы</p>
              {isOrganizer && (
                <button
                  onClick={() => navigate(`/tournaments/${tournamentId}/groupstage/setup`)}
                  className={styles.createGroupsBtn}
                >
                  Сформировать
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={tournamentStyles.pageWrapper}>
      <Header scrollToBenefits={() => {}} />
      <main className={tournamentStyles.mainContent}>
        <div className={styles.tournamentContainer}>
          <div className={styles.contentWrapper}>
            <div className={styles.headerRow}>
              <h1 className={tournamentStyles.tournamentName}>Турнирная таблица</h1>
              {isOrganizer && (
                <button
                  onClick={() => navigate(`/tournaments/${tournamentId}/groupstage/setup`)}
                  className={styles.editGroupsBtn}
                >
                  Редактировать
                </button>
              )}
            </div>
          </div>

          <div className={styles.tablesGrid}>
            {groups.map(group => (
              <div key={group.id} className={styles.tableWrapper}>
                <div className={styles.tableScroll}>
                  <table className={styles.groupTable}>
                    <thead>
                      <tr>
                        <th colSpan={2}>Гр. {group.number}</th>
                        {group.players.map((_, i) => <th key={i}>{i + 1}</th>)}
                        <th>Очки</th>
                        <th>Место</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.players.map((player, i) => (
                        <tr key={player.id}>
                          <td>{i + 1}</td>
                          <td className={styles.playerName}>{player.displayName}</td>
                          {group.players.map((opponent, j) => {
                            if (opponent.id === player.id) return <td key={opponent.id} className={styles.selfCell} />;
                            const score = player.scores.get(opponent.id) || '';
                            const matchId = player.matchIdMap.get(opponent.id);
                            const isEditing = editingCell?.groupId === group.id &&
                              editingCell?.matchId === matchId &&
                              editingCell?.player1 === player.id &&
                              editingCell?.player2 === opponent.id;

                            return (
                              <td
                                key={opponent.id}
                                className={isOrganizer ? styles.editableCell : ''}
                                onClick={() => handleCellClick(group.id, player, opponent, i, j)}
                              >
                                {isEditing ? (
                                  <input
                                    ref={inputRef}
                                    type="text"
                                    defaultValue={score}
                                    onKeyDown={handleScoreSubmit}
                                    onBlur={() => setEditingCell(null)}
                                    className={styles.scoreInput}
                                    placeholder="4/1"
                                    autoFocus
                                  />
                                ) : (
                                  score || '—'
                                )}
                              </td>
                            );
                          })}
                          <td>{player.points}</td>
                          <td>{player.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupStage;