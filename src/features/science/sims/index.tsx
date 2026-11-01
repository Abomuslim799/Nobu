/**
 * sims — interaktiv simulyatsiyalar ro'yxati (darsdagi { k: 'sim', id } bloki shu nom bilan ochadi).
 * Har biri: chizma (SVG) + boshqaruv (slayderlar) + o'lchangan qiymatlar.
 */
import { Derivative } from '@/features/science/sims/derivative';
import { Integral } from '@/features/science/sims/integral';
import { Motion } from '@/features/science/sims/motion';
import { Pendulum } from '@/features/science/sims/pendulum';
import { Projectile } from '@/features/science/sims/projectile';
import { Slope } from '@/features/science/sims/slope';
import { UnitCircle } from '@/features/science/sims/unit-circle';
import { Vectors } from '@/features/science/sims/vectors';

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
