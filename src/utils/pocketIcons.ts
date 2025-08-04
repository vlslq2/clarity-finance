import { CreditCard, PiggyBank, Landmark, Wallet, DollarSign, Coins, Banknote, Receipt } from 'lucide-react';

export const pocketIcons = [
  { name: 'CreditCard', icon: CreditCard },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Landmark', icon: Landmark },
  { name: 'Wallet', icon: Wallet },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Coins', icon: Coins },
  { name: 'Banknote', icon: Banknote },
  { name: 'Receipt', icon: Receipt },
];

export const getPocketIcon = (name: string) => {
  const icon = pocketIcons.find(i => i.name === name);
  return icon ? icon.icon : Wallet;
};