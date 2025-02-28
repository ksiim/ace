import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import styles from "./OTPInput.module.scss";

interface OTPInputProps {
  onComplete: (otp: string) => void;
}

export interface OTPInputRef {
  focus: () => void;
  clear: () => void;
}

const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(({ onComplete }, ref) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  
  useImperativeHandle(ref, () => ({
    focus: () => inputsRef.current[0]?.focus(),
    clear: () => setOtp(["", "", "", ""]),
  }));
  
  const handleChange = (index: number, value: string, event?: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    
    if (value.length === 1) {
      newOtp[index] = value;
      if (index < 3) {
        inputsRef.current[index + 1]?.focus();
      }
    } else if (!value && event?.key === "Backspace") {
      newOtp[index] = "";
      
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = "";
      }
    }
    
    setOtp(newOtp);
    
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  // Обработчик вставки из буфера обмена
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData("text").trim();
    if (!/^\d{4}$/.test(pasteData)) return; // Разрешаем только 4 цифры
    
    const newOtp = pasteData.split("");
    setOtp(newOtp);
    onComplete(pasteData);
    
    // Устанавливаем фокус на последний инпут
    inputsRef.current[3]?.focus();
  };
  
  return (
    <div className={styles.otpContainer}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleChange(index, "", e)}
          onPaste={handlePaste} // Добавляем обработчик вставки
          className={styles.otpInput}
        />
      ))}
    </div>
  );
});

export default OTPInput;