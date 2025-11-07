import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../../../../utils/apiRequest.ts';
import Header from '../../../../../../components/Header/Header.tsx';
import styles from './AutogenerateGroupStage.module.scss';
import tournamentStyles from '../../../../TournamentPage.module.scss';

// ──────────────────────────────────────────────────────────────────────────────
//  ИНТЕРФЕЙСЫ
// ──────────────────────────────────────────────────────────────────────────────
interface Participant {
  id: number;
  name: string;
  surname: string;
  score?: number;
  partner?: Participant;
  isPartner?: boolean;
}

interface ParticipantResponse {
  id: number;
  user_id: number;
  partner_id?: number;
}

interface Group {
  id?: number;
  number: number;
  name: string;
  created_at?: string;
  participants_ids: number[];
  tournament0_id: number;
}

interface DraggedParticipant {
  participant: Participant;
  source: 'group' | 'unassigned';
  groupNumber?: number;
}

interface GroupStageCreate {
  name: string;
  number: number;
  tournament_id: number;
  participants_ids: number[];
}

// ──────────────────────────────────────────────────────────────────────────────
//  КОМПОНЕНТ ПАРЫ — БЕЗ touchAction: none
// ──────────────────────────────────────────────────────────────────────────────
const ParticipantPair: React.FC<{
  participant: Participant;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}> = ({ participant, isDraggable = false, onDragStart, onTouchStart }) => (
  <li
    className={`${styles.participantItem} ${styles.participantPair}`}
    draggable={isDraggable}
    onDragStart={onDragStart}
    onTouchStart={onTouchStart}
    // УДАЛЕНО: style={{ touchAction: 'none' }}
  >
    <div className={styles.participantNames}>
      <span className={styles.participantName}>{participant.surname}</span>
      {participant.partner && (
        <span className={`${styles.participantName} ${styles.partnerName}`}>
          /{participant.partner.surname}
        </span>
      )}
    </div>
    <div className={styles.participantScores}>
      <span className={styles.participantScore}>{participant.score ?? 0}</span>
      {participant.partner && (
        <span className={styles.participantScore}>/{participant.partner.score ?? 0}</span>
      )}
    </div>
  </li>
);

// ──────────────────────────────────────────────────────────────────────────────
//  ОСНОВНОЙ КОМПОНЕНТ
// ──────────────────────────────────────────────────────────────────────────────
const GroupStage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [unassigned, setUnassigned] = useState<Participant[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [draggedParticipant, setDraggedParticipant] = useState<DraggedParticipant | null>(null);
  const [draggingClone, setDraggingClone] = useState<HTMLElement | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const autoScrollRef = useRef<number | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  //  ЗАГРУЗКА ДАННЫХ (без изменений)
  // ──────────────────────────────────────────────────────────────────────────
  const fetchParticipantDetails = async (userId: number): Promise<Participant | null> => {
    try {
      const resp = await apiRequest(`users/${userId}`, 'GET', undefined, true);
      return { id: resp.id, name: resp.name, surname: resp.surname, score: resp.score ?? 0 };
    } catch (e) {
      console.error(`Ошибка загрузки пользователя ${userId}`, e);
      return null;
    }
  };

  const fetchParticipants = async () => {
    if (!tournamentId) return [];
    try {
      const resp = await apiRequest(`tournaments/${tournamentId}/participants`, 'GET', undefined, true);
      const data: ParticipantResponse[] = resp?.data ?? [];

      const allUserIds = new Set<number>();
      data.forEach(p => {
        allUserIds.add(p.user_id);
        if (p.partner_id) allUserIds.add(p.partner_id);
      });

      const usersDetails = await Promise.all(
        Array.from(allUserIds).map(async uid => {
          const user = await fetchParticipantDetails(uid);
          return [uid, user] as const;
        })
      );

      const usersMap = new Map(usersDetails.filter(([, u]) => u !== null));

      const result: Participant[] = [];
      const processed = new Set<number>();

      data.forEach(p => {
        if (processed.has(p.id)) return;
        const main = usersMap.get(p.user_id);
        if (!main) return;

        let partner: Participant | undefined;
        if (p.partner_id) {
          const partnerUser = usersMap.get(p.partner_id);
          if (partnerUser) partner = { ...partnerUser, isPartner: true };
        }

        result.push({ ...main, id: p.id, partner });
        processed.add(p.id);
      });

      setParticipants(result);
      return result;
    } catch (e) {
      console.error('Ошибка загрузки участников', e);
      setParticipants([]);
      return [];
    }
  };

  const fetchExistingGroups = async (): Promise<Group[]> => {
    if (!tournamentId) return [];
    try {
      const groupsResp = await apiRequest(`groups/tournament/${tournamentId}`, 'GET', undefined, true);
      const groupsData = Array.isArray(groupsResp) ? groupsResp : groupsResp?.data ?? [];

      const groupsWithIds = await Promise.all(
        groupsData.map(async (g: any) => {
          const linksResp = await apiRequest(`groups/${g.id}/participants`, 'GET', undefined, true);
          const links = Array.isArray(linksResp) ? linksResp : linksResp?.data ?? [];
          const participants_ids = links.map((l: any) => l.participant_id);
          return {
            id: g.id,
            number: g.number,
            name: g.name,
            created_at: g.created_at,
            participants_ids,
            tournament0_id: Number(tournamentId),
          };
        })
      );
      return groupsWithIds;
    } catch (e) {
      console.error('Ошибка загрузки групп', e);
      return [];
    }
  };

  const fetchGroupsPreview = async (allParticipants: Participant[]) => {
    if (!tournamentId) return;
    try {
      const resp = await apiRequest(
        `groups/tournaments/${tournamentId}/preview`,
        'POST',
        { group_size: 4 },
        true
      );

      const groupsData = resp?.groups ?? [];
      const unassignedIds = resp?.unassigned ?? [];

      const mapped: Group[] = groupsData.map((g: any) => ({
        number: g.number,
        name: g.name,
        created_at: new Date().toISOString(),
        participants_ids: g.participants_ids ?? [],
        tournament0_id: Number(tournamentId),
      }));

      const unassignedParticipants = unassignedIds
        .map((id: number) => allParticipants.find(p => p.id === id))
        .filter((p: Participant | undefined): p is Participant => p !== undefined);

      setGroups(mapped);
      setUnassigned(unassignedParticipants);
    } catch (e) {
      console.error('Ошибка preview', e);
      setGroups([]);
      setUnassigned([]);
    }
  };

  const loadData = async () => {
    if (!tournamentId) return;
    setLoading(true);
    const allParticipants = await fetchParticipants();
    const existing = await fetchExistingGroups();

    if (existing.length > 0) {
      setGroups(existing);
      const assigned = new Set(existing.flatMap(g => g.participants_ids));
      setUnassigned(allParticipants.filter(p => !assigned.has(p.id)));
    } else {
      await fetchGroupsPreview(allParticipants);
    }
    setLoading(false);
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  ВСПОМОГАТЕЛЬНЫЕ
  // ──────────────────────────────────────────────────────────────────────────
  const getParticipantById = (id: number) => participants.find(p => p.id === id);

  const addNewGroup = () => {
    const maxNum = groups.length ? Math.max(...groups.map(g => g.number)) : 0;
    const newGroup: Group = {
      number: maxNum + 1,
      name: `Группа ${maxNum + 1}`,
      created_at: new Date().toISOString(),
      participants_ids: [],
      tournament0_id: Number(tournamentId),
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const deleteGroup = (groupNumber: number) => {
    const group = groups.find(g => g.number === groupNumber);
    if (!group) return;

    const moved = group.participants_ids
      .map(id => getParticipantById(id))
      .filter((p): p is Participant => p !== undefined);

    setUnassigned(prev => [
      ...prev.filter(p => !moved.some(m => m.id === p.id)),
      ...moved,
    ]);
    setGroups(prev => prev.filter(g => g.number !== groupNumber));
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  СОХРАНЕНИЕ
  // ──────────────────────────────────────────────────────────────────────────
  const saveGroups = async () => {
    if (!tournamentId || groups.length === 0) return;
    setSaving(true);
    setSaveStatus('idle');

    try {
      const payload: GroupStageCreate[] = groups.map(g => ({
        name: g.name,
        number: g.number,
        tournament_id: Number(tournamentId),
        participants_ids: g.participants_ids,
      }));

      await apiRequest(`groups/tournament/${tournamentId}`, 'DELETE', undefined, true);
      await apiRequest(`groups/tournaments/${tournamentId}/confirm`, 'POST', payload, true);

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        navigate(`/tournaments/${tournamentId}/groupstage`, { replace: true });
      }, 2000);
    } catch (e) {
      console.error('Ошибка при сохранении групп:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  DRAG & DROP (MOUSE)
  // ──────────────────────────────────────────────────────────────────────────
  const handleDragStart = (
    e: React.DragEvent,
    participant: Participant,
    source: 'group' | 'unassigned',
    groupNumber?: number
  ) => {
    setDraggedParticipant({ participant, source, groupNumber });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetGroupNumber: number | null) => {
    if (!draggedParticipant) return;
    e.preventDefault();

    const { participant, source, groupNumber } = draggedParticipant;
    const pid = participant.id;

    if (source === 'unassigned') setUnassigned(prev => prev.filter(p => p.id !== pid));
    if (source === 'group' && groupNumber !== undefined) {
      setGroups(prev =>
        prev.map(g =>
          g.number === groupNumber ? { ...g, participants_ids: g.participants_ids.filter(id => id !== pid) } : g
        )
      );
    }

    if (targetGroupNumber !== null) {
      setGroups(prev =>
        prev.map(g =>
          g.number === targetGroupNumber
            ? { ...g, participants_ids: [...g.participants_ids.filter(id => id !== pid), pid] }
            : g
        )
      );
    } else {
      setUnassigned(prev => (prev.some(p => p.id === pid) ? prev : [...prev, participant]));
    }

    setDraggedParticipant(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  TOUCH DRAG & DROP — БЕЗ БЛОКИРОВКИ СКРОЛЛА
  // ──────────────────────────────────────────────────────────────────────────
  const updateClonePosition = (x: number, y: number) => {
    if (!draggingClone) return;
    draggingClone.style.left = `${x}px`;
    draggingClone.style.top = `${y}px`;
  };

  const startAutoScroll = (clientY: number) => {
    if (autoScrollRef.current) return;

    const scrollStep = () => {
      const edge = 100;
      const speed = 15;
      // const currentY = window.scrollY;

      if (clientY < edge) {
        window.scrollBy(0, -speed);
      } else if (clientY > window.innerHeight - edge) {
        window.scrollBy(0, speed);
      } else {
        autoScrollRef.current = null;
        return;
      }

      autoScrollRef.current = requestAnimationFrame(scrollStep);
    };

    autoScrollRef.current = requestAnimationFrame(scrollStep);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const highlightDropZone = (x: number, y: number) => {
    document.querySelectorAll(`.${styles['drag-over']}`).forEach(el => el.classList.remove(styles['drag-over']));

    const groupCards = document.querySelectorAll(`.${styles.groupCard}`);
    const unassigned = document.querySelector(`.${styles.unassignedSection}`);

    for (const card of groupCards) {
      const r = card.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        card.classList.add(styles['drag-over']);
        return;
      }
    }

    if (unassigned) {
      const r = unassigned.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        unassigned.classList.add(styles['drag-over']);
      }
    }
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    participant: Participant,
    source: 'group' | 'unassigned',
    groupNumber?: number
  ) => {
    const touch = e.touches[0];
    const li = e.currentTarget as HTMLElement;

    const timeout = setTimeout(() => {
      setDraggedParticipant({ participant, source, groupNumber });
      setIsTouchDragging(true);

      const clone = li.cloneNode(true) as HTMLElement;
      clone.className = li.className + ' ' + styles['dragging-clone'];
      clone.style.width = `${li.offsetWidth}px`;
      clone.style.touchAction = 'none'; // ТОЛЬКО НА КЛОНЕ
      document.body.appendChild(clone);
      setDraggingClone(clone);

      updateClonePosition(touch.clientX, touch.clientY);
      startAutoScroll(touch.clientY);
    }, 150);

    const cancel = () => clearTimeout(timeout);
    document.addEventListener('touchend', cancel, { once: true });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isTouchDragging || !draggingClone) return;
    const touch = e.touches[0];
    updateClonePosition(touch.clientX, touch.clientY);
    highlightDropZone(touch.clientX, touch.clientY);

    stopAutoScroll();
    startAutoScroll(touch.clientY);
  };

  const cleanupDrag = () => {
    setDraggedParticipant(null);
    setIsTouchDragging(false);
    stopAutoScroll();
    if (draggingClone?.parentNode) draggingClone.parentNode.removeChild(draggingClone);
    setDraggingClone(null);
    document.querySelectorAll(`.${styles['drag-over']}`).forEach(el => el.classList.remove(styles['drag-over']));
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isTouchDragging || !draggedParticipant) return;

    stopAutoScroll();
    const touch = e.changedTouches[0];
    let targetGroupNumber: number | null = null;

    const groupCards = document.querySelectorAll(`.${styles.groupCard}`);
    for (const card of groupCards) {
      const r = card.getBoundingClientRect();
      if (touch.clientX >= r.left && touch.clientX <= r.right && touch.clientY >= r.top && touch.clientY <= r.bottom) {
        const num = (card as HTMLElement).dataset.groupNumber;
        if (num) {
          targetGroupNumber = Number(num);
          break;
        }
      }
    }

    const { participant, source, groupNumber } = draggedParticipant;
    const pid = participant.id;

    if (source === 'unassigned') setUnassigned(prev => prev.filter(p => p.id !== pid));
    if (source === 'group' && groupNumber !== undefined) {
      setGroups(prev =>
        prev.map(g =>
          g.number === groupNumber ? { ...g, participants_ids: g.participants_ids.filter(id => id !== pid) } : g
        )
      );
    }

    if (targetGroupNumber !== null) {
      setGroups(prev =>
        prev.map(g =>
          g.number === targetGroupNumber
            ? { ...g, participants_ids: [...g.participants_ids.filter(id => id !== pid), pid] }
            : g
        )
      );
    } else {
      setUnassigned(prev => (prev.some(p => p.id === pid) ? prev : [...prev, participant]));
    }

    cleanupDrag();
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  ПОДПИСКА НА TOUCH — БЕЗ preventDefault, БЕЗ touchAction
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTouchDragging) return;

    const onTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const onTouchEnd = (e: TouchEvent) => handleTouchEnd(e);

    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      stopAutoScroll();
    };
  }, [isTouchDragging, draggingClone]);

  // ──────────────────────────────────────────────────────────────────────────
  //  LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [tournamentId]);

  // ──────────────────────────────────────────────────────────────────────────
  //  LOADER
  // ──────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={tournamentStyles.loaderContainer}>
        <div className={tournamentStyles.loader}></div>
        <p>Загрузка групп...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────────────────────
  const isEditMode = groups.some(g => g.id !== undefined);
  const showAddButton = participants.length > 0;

  return (
    <div className={tournamentStyles.pageWrapper}>
      <Header scrollToBenefits={() => {}} />
      <main className={tournamentStyles.mainContent}>
        <div className={tournamentStyles.tournamentContainer} style={{ alignItems: 'flex-start' }}>

          <div className={tournamentStyles.contentWrapper}>
            <h1 className={tournamentStyles.tournamentName}>
              {isEditMode ? 'Редактирование групп' : 'Настройка групп турнира'}
            </h1>
          </div>

          <div className={tournamentStyles.contentWrapper}>
            <div className={styles.headerWithSave}>
              <div></div>
              <button
                onClick={saveGroups}
                disabled={saving || groups.length === 0}
                className={styles.saveGroupsBtn}
              >
                {saving ? 'Сохранение...' : 'Сохранить группы'}
              </button>
            </div>

            {saveStatus === 'success' && (
              <p className={styles.saveSuccess}>Группы успешно сохранены! Перенаправление...</p>
            )}
            {saveStatus === 'error' && (
              <p className={styles.saveError}>Ошибка при сохранении. Попробуйте снова.</p>
            )}
          </div>

          <div className={styles.groupsContainer}>
            {groups.sort((a, b) => a.number - b.number).map(group => (
              <div
                key={group.number}
                className={styles.groupCard}
                data-group-number={group.number}
                onDragOver={e => {
                  handleDragOver(e);
                  e.currentTarget.classList.add(styles['drag-over']);
                }}
                onDragLeave={e => e.currentTarget.classList.remove(styles['drag-over'])}
                onDrop={e => {
                  e.currentTarget.classList.remove(styles['drag-over']);
                  handleDrop(e, group.number);
                }}
              >
                <div className={styles.groupHeader}>
                  <h2 className={styles.groupTitle}>{group.name}</h2>
                  <button
                    onClick={() => deleteGroup(group.number)}
                    className={styles.deleteGroupBtn}
                    title="Удалить группу"
                  >
                    x
                  </button>
                </div>

                <ul className={styles.participantsList}>
                  {group.participants_ids.length > 0 ? (
                    group.participants_ids.map(pid => {
                      const p = getParticipantById(pid);
                      if (!p) return null;
                      return (
                        <ParticipantPair
                          key={pid}
                          participant={p}
                          isDraggable
                          onDragStart={e => handleDragStart(e, p, 'group', group.number)}
                          onTouchStart={e => handleTouchStart(e, p, 'group', group.number)}
                        />
                      );
                    })
                  ) : (
                    <li className={styles.emptyGroup}>Перетащите сюда пару</li>
                  )}
                </ul>
              </div>
            ))}

            {showAddButton && (
              <button onClick={addNewGroup} className={styles.addGroupButton}>
                +
              </button>
            )}
          </div>

          <div className={tournamentStyles.contentWrapper}>
            <div
              className={styles.unassignedSection}
              onDragOver={e => {
                handleDragOver(e);
                e.currentTarget.classList.add(styles['drag-over']);
              }}
              onDragLeave={e => e.currentTarget.classList.remove(styles['drag-over'])}
              onDrop={e => {
                e.currentTarget.classList.remove(styles['drag-over']);
                handleDrop(e, null);
              }}
            >
              <h2 className={styles.sectionTitle}>Нераспределённые участники</h2>
              <ul className={styles.participantsList}>
                {unassigned.length > 0 ? (
                  unassigned.map(p => (
                    <ParticipantPair
                      key={p.id}
                      participant={p}
                      isDraggable
                      onDragStart={e => handleDragStart(e, p, 'unassigned')}
                      onTouchStart={e => handleTouchStart(e, p, 'unassigned')}
                    />
                  ))
                ) : (
                  <li className={styles.emptyGroup}>Все пары распределены</li>
                )}
              </ul>
            </div>
          </div>

          {groups.length === 0 && unassigned.length === 0 && (
            <div className={tournamentStyles.contentWrapper}>
              <p className={tournamentStyles.error}>Группы пока не сформированы</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupStage;