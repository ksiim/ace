import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../utils/apiRequest";
import styles from "../../AdminPanel.module.scss";

interface Trainer {
  id: number;
  name: string;
  photo: string;
  description: string;
  phone: string;
  address: string;
  region_id: number;
}

interface Region {
  id: number;
  name: string;
}

interface TrainerManagementProps {
  onError: (error: string) => void;
}

const TrainerManagement: React.FC<TrainerManagementProps> = ({ onError }) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [editTrainerData, setEditTrainerData] = useState<Trainer | null>(null);
  const [newTrainerData, setNewTrainerData] = useState<Trainer>({
    id: 0,
    name: "",
    photo: "",
    description: "",
    phone: "",
    address: "",
    region_id: 0
  });
  const [regions, setRegions] = useState<Region[]>([]); // Стейт для хранения регионов
  
  // Загрузка тренеров и регионов при монтировании компонента
  useEffect(() => {
    apiRequest("trainers/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setTrainers(data.data); // Обновляем список тренеров
        } else {
          onError("Ошибка при загрузке тренеров");
        }
      })
      .catch(() => onError("Ошибка при загрузке тренеров"));
    
    apiRequest("regions/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setRegions(data.data); // Обновляем список регионов
        } else {
          onError("Ошибка при загрузке регионов");
        }
      })
      .catch(() => onError("Ошибка при загрузке регионов"));
  }, []);
  
  const handleCreateTrainer = () => {
    apiRequest("trainers/", "POST", newTrainerData, true)
      .then((data) => {
        if (data) {
          setTrainers(prevTrainers => [...prevTrainers, data]);
          setNewTrainerData({ id: 0, name: "", photo: "", description: "", phone: "", address: "", region_id: 0 });
        } else {
          onError("Ошибка при создании тренера");
        }
      })
      .catch(() => onError("Ошибка при создании тренера"));
  };
  
  const handleEditTrainer = (trainer: Trainer) => {
    setEditTrainerData({ ...trainer }); // Подставляем данные тренера для редактирования
  };
  
  const handleUpdateTrainer = () => {
    if (editTrainerData) {
      apiRequest(`trainers/${editTrainerData.id}`, "PUT", editTrainerData, true)
        .then((data) => {
          if (data) {
            setTrainers(prevTrainers =>
              prevTrainers.map((trainer) => trainer.id === editTrainerData.id ? editTrainerData : trainer)
            );
            setEditTrainerData(null); // После обновления сбрасываем редактируемые данные
          } else {
            onError("Ошибка при обновлении тренера");
          }
        })
        .catch(() => onError("Ошибка при обновлении тренера"));
    }
  };
  
  const handleDeleteTrainer = (id: number) => {
    apiRequest(`trainers/${id}`, "DELETE", undefined, true)
      .then(() => {
        setTrainers(prevTrainers => prevTrainers.filter((trainer) => trainer.id !== id));
      })
      .catch(() => onError("Ошибка при удалении тренера"));
  };
  
  const handleCancelEdit = () => {
    setEditTrainerData(null); // Отменить редактирование
  };
  
  // Обработчик изменений в полях формы редактирования тренера
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (editTrainerData) {
      setEditTrainerData({
        ...editTrainerData,
        [e.target.name]: e.target.value
      });
    }
  };
  
  return (
    <div className={styles.tabContent}>
      <div className={styles.tableContainer}>
        <h2>Список тренеров</h2>
        
        {/* Форма для добавления нового тренера */}
        <div className={styles.formContainer}>
          <h3>Добавить нового тренера</h3>
          {/* ... другие поля формы для нового тренера */}
          <select
            id="region_id"
            name="region_id"
            value={newTrainerData.region_id || ''}
            onChange={(e) => setNewTrainerData({
              ...newTrainerData,
              region_id: parseInt(e.target.value)
            })}
          >
            <option value="">Выберите регион</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          <button className={styles.submitButton} onClick={handleCreateTrainer}>Создать</button>
        </div>
        
        {/* Список тренеров */}
        {trainers.length > 0 ? (
          <table className={styles.dataTable}>
            <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Фото</th>
              <th>Описание</th>
              <th>Телефон</th>
              <th>Адрес</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            {trainers.map((trainer) => (
              <tr key={trainer.id}>
                <td>{trainer.id}</td>
                <td>{trainer.name}</td>
                <td><img src={trainer.photo} alt={trainer.name} width={50} height={50}/></td>
                <td>{trainer.description}</td>
                <td>{trainer.phone}</td>
                <td>{trainer.address}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditTrainer(trainer)}
                    >
                      Редактировать
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTrainer(trainer.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noData}>Тренеры не найдены</p>
        )}
        
        {/* Форма для редактирования тренера */}
        {editTrainerData && (
          <div className={styles.formContainer}>
            <h3>Редактировать тренера</h3>
            <input
              type="text"
              name="name"
              value={editTrainerData.name}
              onChange={handleEditChange}
            />
            <input
              type="text"
              name="photo"
              value={editTrainerData.photo}
              onChange={handleEditChange}
            />
            <textarea
              name="description"
              value={editTrainerData.description}
              onChange={handleEditChange}
            />
            <input
              type="text"
              name="phone"
              value={editTrainerData.phone}
              onChange={handleEditChange}
            />
            <input
              type="text"
              name="address"
              value={editTrainerData.address}
              onChange={handleEditChange}
            />
            <select
              id="region_id"
              name="region_id"
              value={editTrainerData.region_id}
              onChange={handleEditChange}
            >
              <option value="">Выберите регион</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <button onClick={handleUpdateTrainer}>Сохранить</button>
            <button onClick={handleCancelEdit}>Отменить</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerManagement;
