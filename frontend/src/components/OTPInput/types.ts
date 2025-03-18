export interface OTPInputProps {
  onComplete: (otp: string) => void;
}

export interface OTPInputRef {
  focus: () => void;
  clear: () => void;
}
