import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../utils/apiRequest";
import styles from "../../AdminPanel.module.scss";

interface Region {
  id: number;
  name: string;
}

interface Trainer {
  id: number;
  name: string;
  photo_path: string;
  description: string;
  phone: string;
  address: string;
  region_id: number;
}

interface TrainerManagementProps {
  onError: (error: string) => void;
}

const TrainerManagement: React.FC<TrainerManagementProps> = ({ onError }) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState<Trainer>({
    id: 0,
    name: "",
    photo_path: "",
    description: "",
    phone: "",
    address: "",
    region_id: 0
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [isEditMode, setIsEditMode] = useState(false); // Flag to track edit mode
  
  // Rest of your useEffect for loading trainers and regions...
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка на изображение
      if (!file.type.startsWith("image/")) {
        onError("Загружать можно только изображения");
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      apiRequest("photos/", "POST", formData, true)
        .then((data) => {
          if (data && data.file_path) {
            // Изменяем путь
            const correctPath = `http://localhost${(data.file_path).slice(4)}`;
            setFormData(prev => ({
              ...prev,
              photo_path: correctPath // Сохраняем исправленный путь
            }));
          } else {
            onError("Ошибка загрузки фото");
          }
        })
        .catch(() => onError("Ошибка загрузки фото"));
    }
  };
  
  const handleCreateTrainer = () => {
    apiRequest("trainers/", "POST", formData, true)
      .then((data) => {
        if (data) {
          setTrainers(prevTrainers => [...prevTrainers, data]);
          // Reset form
          setFormData({ id: 0, name: "", photo_path: "", description: "", phone: "", address: "", region_id: 0 });
        } else {
          onError("Ошибка при создании тренера");
        }
      })
      .catch(() => onError("Ошибка при создании тренера"));
  };
  
  const handleEditTrainer = (trainer: Trainer) => {
    setFormData({...trainer}); // Fill form with trainer data
    setIsEditMode(true); // Set edit mode to true
  };
  
  const handleUpdateTrainer = () => {
    apiRequest(`trainers/${formData.id}`, "PUT", formData, true)
      .then((data) => {
        if (data) {
          setTrainers(prevTrainers =>
            prevTrainers.map((trainer) => trainer.id === formData.id ? formData : trainer)
          );
          // Reset form and exit edit mode
          setFormData({ id: 0, name: "", photo_path: "", description: "", phone: "", address: "", region_id: 0 });
          setIsEditMode(false);
        } else {
          onError("Ошибка при обновлении тренера");
        }
      })
      .catch(() => onError("Ошибка при обновлении тренера"));
  };
  
  const handleDeleteTrainer = (id: number) => {
    apiRequest(`trainers/${id}`, "DELETE", undefined, true)
      .then(() => {
        setTrainers(prevTrainers => prevTrainers.filter((trainer) => trainer.id !== id));
      })
      .catch(() => onError("Ошибка при удалении тренера"));
  };
  
  const handleCancelEdit = () => {
    // Reset form and exit edit mode
    setFormData({ id: 0, name: "", photo_path: "", description: "", phone: "", address: "", region_id: 0 });
    setIsEditMode(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  return (
    <div className={styles.tabContent}>
      <div className={styles.formContainer}>
        <h2>Список тренеров</h2>
        
        {/* Unified form for adding or editing a trainer */}
        <div className={styles.formContainer}>
          <h3>{isEditMode ? "Редактировать тренера" : "Добавить нового тренера"}</h3>
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Имя"
              value={formData.name}
              onChange={handleInputChange}
              name="name"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="photo">Фото тренера</label>
            <input
              type="file"
              id="photo"
              name="photo"
              onChange={handleFileChange}
            />
            {formData.photo_path && (
              <div className={styles.previewImage}>
                <img
                  src={formData.photo_path}
                  alt="Предпросмотр"
                  style={{width: '80px', height: '80px', borderRadius: '15px', marginTop:'10px'}}
                />
              </div>
            
            )}
          </div>
          
          <div className={styles.formGroup}>
            <textarea
              placeholder="Описание"
              value={formData.description}
              onChange={handleInputChange}
              name="description"
            />
          </div>
          
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Телефон"
              value={formData.phone}
              onChange={handleInputChange}
              name="phone"
            />
          </div>
          
          <div className={styles.formGroup}>
            <select
              id="region_id"
              name="region_id"
              value={formData.region_id || ''}
              onChange={handleInputChange}
              disabled={isEditMode} // Disable dropdown when editing
              required
            >
              <option value="" disabled hidden>Выберите регион</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Адрес"
              value={formData.address}
              onChange={handleInputChange}
              name="address"
            />
          </div>
          
          {isEditMode ? (
            <div>
              <button className={styles.submitButton} onClick={handleUpdateTrainer}>Сохранить</button>
              <button className={styles.cancelButton} onClick={handleCancelEdit}>Отменить</button>
            </div>
          ) : (
            <button className={styles.submitButton} onClick={handleCreateTrainer}>Создать</button>
          )}
        </div>
        
        <div className={styles.tableContainer}>
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
                  <td>
                    <img src={trainer.photo_path} alt={trainer.name} />
                  </td>
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
        </div>
      </div>
    </div>
  );
};

export default TrainerManagement;
