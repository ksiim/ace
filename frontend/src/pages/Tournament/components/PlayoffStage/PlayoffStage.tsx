import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../utils/apiRequest';
import styles from './PlayoffStage.module.scss';

interface PlayoffMatch {
  match_id: number;
  participant1_id: number | null;
  participant2_id: number | null;
  score1: number | null;
  score2: number | null;
  winner_id: number | null;
  played: boolean;
  order?: number;
}

interface PlayoffRound {
  round_id: number;
  number: number;
  name: string;
  matches: PlayoffMatch[];
}

interface PlayoffBracket {
  bracket_id: number;
  type: string;
  rounds: PlayoffRound[];
}

interface PlayoffStageSchema {
  stage_id: number;
  brackets: PlayoffBracket[];
}

interface ParticipantMap {
  [id: number]: { displayName: string; points?: number };
}

interface PlayoffStageProps {
  tournamentId: number | string;
  participantMap: ParticipantMap;
  isOrganizer?: boolean;
}

const PlayoffStage: React.FC<PlayoffStageProps> = ({ tournamentId, participantMap, isOrganizer }) => {
  const [stage, setStage] = useState<PlayoffStageSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Для хранения временных значений ввода очков
  const [editScores, setEditScores] = useState<{ [matchId: number]: { score1: string; score2: string } }>({});

  const fetchStage = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`playoffs/tournament/${tournamentId}`, 'GET');
      setStage(data);
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        setError('Олимпийская сетка не создана для этого турнира.');
      } else {
        setError(e?.detail || 'Ошибка загрузки олимпийской сетки');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStage();
  }, [tournamentId]);

  if (loading) return <div>Загрузка олимпийской сетки...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stage || !stage.brackets) return null;

  // Защита: если brackets не массив или пустой
  if (!Array.isArray(stage.brackets) || stage.brackets.length === 0) {
    return <div style={{ color: '#888', textAlign: 'center', margin: '32px 0' }}>Олимпийская сетка не создана или пуста.</div>;
  }

  return (
    <div className={styles.playoffStageWrapper}>
      {stage.brackets.map(bracket => (
        <div key={bracket.bracket_id} className={styles.bracketBlock}>
          <h3 className={styles.bracketTitle}>{bracket.type === 'main' ? 'Основная сетка' : 'Доп. сетка'}</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className={styles.bracketGrid}>
              {bracket.rounds.map((round, roundIdx) => (
                <div key={round.round_id} className={styles.roundColumn}>
                  <div className={styles.roundName}>{round.name}</div>
                  {round.matches
                    .slice() // не мутируем исходный массив
                    .sort((a, b) => (a.order ?? a.match_id) - (b.order ?? b.match_id))
                    .map((match) => {
                      let marginTop: string | undefined = undefined;
                      if (
                        bracket.rounds.length > 1 &&
                        roundIdx === bracket.rounds.length - 1 &&
                        round.matches.length === 1
                      ) {
                        marginTop = `calc(50% - 48px)`;
                      }
                      return (
                        <div
                          key={match.match_id}
                          className={styles.matchCell}
                          style={marginTop ? { marginTop } : {}}
                        >
                          {[match.participant1_id, match.participant2_id].map((pid, idx) => {
                            if (!pid) return <div key={idx} className={styles.emptyCell}>—</div>;
                            const p = participantMap[pid];
                            const localScores = editScores[match.match_id] || { score1: match.score1 ?? '', score2: match.score2 ?? '' };
                            const score = idx === 0 ? localScores.score1 : localScores.score2;
                            // Helper to submit scores on blur
                            const handleBlur = () => {
                              const { score1, score2 } = editScores[match.match_id] || { score1: '', score2: '' };
                              if (score1 !== '' && score2 !== '') {
                                const s1 = parseInt(score1, 10);
                                const s2 = parseInt(score2, 10);
                                if (!isNaN(s1) && !isNaN(s2)) {
                                  apiRequest(
                                    `playoffs/match/${match.match_id}/result`,
                                    'POST',
                                    { score1: s1, score2: s2 },
                                    true
                                  ).then(() => {
                                    fetchStage();
                                    setEditScores(prev2 => {
                                      const copy = { ...prev2 };
                                      delete copy[match.match_id];
                                      return copy;
                                    });
                                  });
                                }
                              }
                            };
                            // Подсветка победителя
                            const isWinner = match.winner_id === pid && match.played;
                            // Определяем скругление для победителя
                            let winnerRadius = undefined;
                            if (isWinner) {
                              if (idx === 0) {
                                winnerRadius = '12px 12px 0 0'; // верхний игрок
                              } else {
                                winnerRadius = '0 0 12px 12px'; // нижний игрок
                              }
                            }
                            return (
                              <div
                                key={pid}
                                className={styles.playerCell}
                                style={isWinner ? {
                                  background: 'linear-gradient(90deg, #eaffea 80%, #f6fff6 100%)',
                                  boxShadow: '0 2px 8px 0 #38b73822',
                                  borderRadius: winnerRadius,
                                  fontWeight: 'bold',
                                  color: '#38b738'
                                } : {}}
                              >
                                <span
                                  className={styles.playerName}
                                  style={isWinner ? { fontWeight: 'bold', color: '#38b738' } : {}}
                                >
                                  {p?.displayName || '—'}
                                </span>
                                <span className={styles.playerCellBar}></span>
                                {isOrganizer && !match.played ? (
                                  <input
                                    type="number"
                                    min={0}
                                    style={{ width: 36, fontSize: '1rem', padding: '2px 4px', marginLeft: 2 }}
                                    value={score}
                                    onChange={e => {
                                      const value = e.target.value;
                                      setEditScores(prev => {
                                        const prevScores = prev[match.match_id] || { score1: '', score2: '' };
                                        const newScores = idx === 0
                                          ? { ...prevScores, score1: value }
                                          : { ...prevScores, score2: value };
                                        return { ...prev, [match.match_id]: newScores };
                                      });
                                    }}
                                    onBlur={handleBlur}
                                  />
                                ) : (
                                  <span className={styles.playerScore}>{score !== '' && score !== undefined ? score : ''}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayoffStage;
