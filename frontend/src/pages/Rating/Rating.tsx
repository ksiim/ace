import React, { useState, useEffect } from 'react';
import styles from './Rating.module.scss';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import { apiRequest } from '../../utils/apiRequest.ts'; // Импортируем ваш apiRequest

interface Player {
  id: number;
  name: string;
  surname: string;
  patronymic: string;
  birth_date: string;
  region_id: number;
  score: number;
  tournaments: number;
  sex_id: number;
}

interface Sex {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

const Rating: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSex, setSelectedSex] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  
  // Функция для загрузки количества турниров за 52 недели
  const fetchTournamentCount = async (userId: number) => {
    const response = await apiRequest(
      `users/${userId}/tournament-count-per-52-weeks`,
      'GET',
      undefined,
      false // authRequired = false
    );
    if (!response.error && response.count_of_tournament_last_52_weeks !== undefined) {
      return response.count_of_tournament_last_52_weeks;
    }
    return 0; // Если произошла ошибка, возвращаем 0
  };
  
  // Загрузка игроков и их количества турниров
  const fetchPlayers = async () => {
    const params = new URLSearchParams({
      ...(searchTerm && { fio: searchTerm }),
      ...(selectedSex !== null && { sex_id: selectedSex.toString() }),
      ...(selectedRegion !== null && { region_id: selectedRegion.toString() }),
    }).toString();
    
    const response = await apiRequest(`users/?${params}`, 'GET', undefined, false); // authRequired = false
    if (!response.error && response.data) {
      // Для каждого игрока загружаем количество турниров
      const playersWithTournaments = await Promise.all(
        response.data.map(async (player: Player) => {
          const tournaments = await fetchTournamentCount(player.id);
          return { ...player, tournaments };
        })
      );
      setPlayers(playersWithTournaments);
      setFilteredPlayers(playersWithTournaments);
    } else {
      console.error('Ошибка при загрузке игроков:', response);
    }
  };
  
  // Загрузка категорий
  const fetchSexes = async () => {
    const response = await apiRequest('sex/', 'GET');
    if (!response.error && response.data) {
      setSexes(response.data);
    } else {
      console.error('Ошибка при загрузке полов:', response);
    }
  };
  
  // Загрузка регионов
  const fetchRegions = async () => {
    const response = await apiRequest('regions/', 'GET');
    if (!response.error && response.data) {
      setRegions(response.data);
    } else {
      console.error('Ошибка при загрузке регионов:', response);
    }
  };
  
  useEffect(() => {
    fetchPlayers();
    fetchSexes();
    fetchRegions();
  }, [searchTerm, selectedSex, selectedRegion]);
  
  useEffect(() => {
    let result = [...players];
    
    // Фильтр по поисковому запросу (имя)
    if (searchTerm) {
      result = result.filter(player =>
        `${player.name} ${player.surname} ${player.patronymic}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Фильтр по категории
    if (selectedSex) {
      result = result.filter(player => player.sex_id === selectedSex);
    }
    
    // Фильтр по региону
    if (selectedRegion) {
      result = result.filter(player => player.region_id === selectedRegion);
    }
    
    // Сортировка по очкам (по убыванию)
    result.sort((a, b) => b.score - a.score);
    
    // Обновление мест после фильтрации и сортировки
    result = result.map((player, index) => ({
      ...player,
      place: index + 1
    }));
    
    setFilteredPlayers(result);
  }, [players, searchTerm, selectedSex, selectedRegion]);
  
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}} />
      <div className={styles.classificationContainer}>
        <h1 className={styles.title}>Классификация на {new Date().toLocaleDateString('ru-RU')}</h1>
        
        <div className={styles.filtersContainer}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Поиск по фамилии..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="sexes">Пол:</label>
            <select
              id="sexes"
              value={selectedSex || ''}
              onChange={(e) => setSelectedSex(Number(e.target.value) || null)}
              className={styles.select}
            >
              <option value="">Все полы</option>
              {sexes.map(sex => (
                <option key={sex.id} value={sex.id}>
                  {sex.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="region">Регион:</label>
            <select
              id="region"
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(Number(e.target.value) || null)}
              className={styles.select}
            >
              <option value="">Все регионы</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.classificationTable}>
            <thead>
            <tr>
              <th>Место</th>
              <th>ФИО</th>
              <th>Дата рождения</th>
              <th>Регион</th>
              <th>Очки</th>
              <th>Кол-во турниров за 52 недели</th>
            </tr>
            </thead>
            <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? styles.evenRow : ''}>
                <td>{index + 1}</td>
                <td>{`${player.surname} ${player.name} ${player.patronymic}`}</td>
                <td>{player.birth_date || '-'}</td>
                <td>{regions.find(region => region.id === player.region_id)?.name || '-'}</td>
                <td>{player.score}</td>
                <td>{player.tournaments}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Rating;
