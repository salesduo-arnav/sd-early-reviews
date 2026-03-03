import bcrypt from 'bcryptjs';

export const generateOtp = (): string => {
    // Generates a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
};

export const verifyOtpHash = async (otp: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(otp, hash);
};
