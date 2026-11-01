/**
 * sims — interaktiv simulyatsiyalar ro'yxati (darsdagi { k: 'sim', id } bloki shu nom bilan ochadi).
 * Har biri: chizma (SVG) + boshqaruv (slayderlar) + o'lchangan qiymatlar.
 */
import { Derivative } from './derivative';
import { Integral } from './integral';
import { Motion } from './motion';
import { Pendulum } from './pendulum';
import { Projectile } from './projectile';
import { Slope } from './slope';
import { UnitCircle } from './unit-circle';
import { Vectors } from './vectors';

export const SIMS: Record<string, { title: string; C: () => React.JSX.Element }> = {
  slope: { title: 'Qiyalik', C: Slope },
  derivative: { title: 'Kesuvchidan urinmaga', C: Derivative },
  integral: { title: "To'rtburchaklardan yuzaga", C: Integral },
  unitcircle: { title: 'Birlik aylana', C: UnitCircle },
  vectors: { title: "Vektorlarni qo'shish", C: Vectors },
  motion: { title: 'Harakat grafiklari', C: Motion },
  projectile: { title: 'Otilgan jism', C: Projectile },
  pendulum: { title: 'Mayatnik', C: Pendulum },
};
