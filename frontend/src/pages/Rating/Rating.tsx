import React, { useState, useEffect } from 'react';
import styles from './Rating.module.scss';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';

interface Player {
  place: number;
  name: string;
  birthDate?: string;
  city: string;
  points: number;
  tournaments: number;
  category?: string; // Assuming we have categories based on age groups
}

const Rating: React.FC = () => {
  // Sample data based on the image
  const [players, setPlayers] = useState<Player[]>([
    { place: 1, name: 'Захарченко Валерия', city: 'Ростов-на-Дону', points: 75, tournaments: 1, category: 'Юниоры' },
    { place: 2, name: 'Ширяева Александрина', city: 'Ростов-на-Дону', points: 60, tournaments: 1, category: 'Юниоры' },
    { place: 3, name: 'Ващенко Артем', city: 'Таганрог', points: 45, tournaments: 1, category: 'Дети' },
    { place: 4, name: 'Шитова Милана', city: 'Таганрог', points: 45, tournaments: 1, category: 'Дети' },
    { place: 5, name: 'Лукашева Вера', city: 'Ростов-на-Дону', points: 30, tournaments: 1, category: 'Юниоры' },
  ]);
  
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  // Get unique categories and cities for filter dropdowns
  const categories = Array.from(new Set(players.map(player => player.category)));
  const cities = Array.from(new Set(players.map(player => player.city)));
  
  useEffect(() => {
    let result = [...players];
    
    // Filter by search term (name)
    if (searchTerm) {
      result = result.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(player => player.category === selectedCategory);
    }
    
    // Filter by city
    if (selectedCity) {
      result = result.filter(player => player.city === selectedCity);
    }
    
    // Sort by points (highest first)
    result.sort((a, b) => b.points - a.points);
    
    // Update places after filtering and sorting
    result = result.map((player, index) => ({
      ...player,
      place: index + 1
    }));
    
    setFilteredPlayers(result);
  }, [players, searchTerm, selectedCategory, selectedCity]);
  
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}}/>
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
            {searchTerm && (
              <div className={styles.searchSuggestions}>
                {players
                  .filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 5)
                  .map((player, index) => (
                    <div
                      key={index}
                      className={styles.suggestion}
                      onClick={() => setSearchTerm(player.name)}
                    >
                      {player.name}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="category">Категория:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.select}
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="city">Город:</label>
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={styles.select}
            >
              <option value="">Все города</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
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
              <th>Город</th>
              <th>Очки</th>
              <th>Кол-во турниров за 52 недели</th>
            </tr>
            </thead>
            <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={index} className={index % 2 === 0 ? styles.evenRow : ''}>
                <td>{player.place}</td>
                <td>{player.name}</td>
                <td>{player.birthDate || '-'}</td>
                <td>{player.city}</td>
                <td>{player.points}</td>
                <td>{player.tournaments}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Rating;