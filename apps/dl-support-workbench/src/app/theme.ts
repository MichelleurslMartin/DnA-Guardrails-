import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

const brandRamp: BrandVariants = {
  10: '#F8ECEC',
  20: '#F1D9DB',
  30: '#E7B8BB',
  40: '#DC979C',
  50: '#D27A80',
  60: '#C66068',
  70: '#B84F57',
  80: '#A3424A',
  90: '#8C3941',
  100: '#743037',
  110: '#61282E',
  120: '#4F2126',
  130: '#3E1A1F',
  140: '#2F1419',
  150: '#210E12',
  160: '#15080B',
};

const fontFamilyBase = '"Segoe UI Variable", "Segoe UI", sans-serif';

const lightBase = createLightTheme(brandRamp);
const darkBase = createDarkTheme(brandRamp);

export const appThemes: Record<'light' | 'dark', Theme> = {
  light: {
    ...lightBase,
    colorNeutralBackground1: '#FFFFFF',
    colorNeutralBackground2: '#F5F8F6',
    colorNeutralBackground3: '#EEF3F0',
    colorNeutralForeground1: '#202B29',
    colorNeutralForeground2: '#62716D',
    colorNeutralStroke1: '#D8E1DE',
    colorNeutralStroke2: '#E6ECE9',
    colorBrandForeground1: '#A3424A',
    fontFamilyBase,
  },
  dark: {
    ...darkBase,
    colorNeutralBackground1: '#202B29',
    colorNeutralBackground2: '#18211F',
    colorNeutralBackground3: '#2B3834',
    colorNeutralForeground1: '#F0F4F2',
    colorNeutralForeground2: '#A9B6B1',
    colorNeutralStroke1: '#43524E',
    colorNeutralStroke2: '#34413D',
    colorBrandForeground1: '#E6A3A7',
    fontFamilyBase,
  },
};