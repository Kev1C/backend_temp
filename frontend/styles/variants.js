// frontend/styles/variants.js

// Button variants
export const buttonVariants = {
  default: {
    backgroundColor: 'primary.DEFAULT',
    color: 'primary.foreground',
    padding: 'spacing.4',
    borderRadius: 'radius.md',
  },
  secondary: {
    backgroundColor: 'secondary.DEFAULT',
    color: 'secondary.foreground',
    padding: 'spacing.4',
    borderRadius: 'radius.md',
  },
  destructive: {
    backgroundColor: 'destructive.DEFAULT',
    color: 'destructive.foreground',
    padding: 'spacing.4',
    borderRadius: 'radius.md',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'border',
    padding: 'spacing.4',
    borderRadius: 'radius.md',
  },
  ghost: {
    backgroundColor: 'transparent',
    padding: 'spacing.4',
    borderRadius: 'radius.md',
  },
};

// Input variants
export const inputVariants = {
  default: {
    backgroundColor: 'background',
    borderWidth: 1,
    borderColor: 'input',
    borderRadius: 'radius.md',
    padding: 'spacing.3',
  },
  filled: {
    backgroundColor: 'muted.DEFAULT',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 'radius.md',
    padding: 'spacing.3',
  },
};

// Card variants
export const cardVariants = {
  default: {
    backgroundColor: 'card.DEFAULT',
    borderRadius: 'radius.lg',
    padding: 'spacing.6',
    shadowColor: 'shadows.DEFAULT',
  },
  flat: {
    backgroundColor: 'card.DEFAULT',
    borderRadius: 'radius.lg',
    padding: 'spacing.6',
    borderWidth: 1,
    borderColor: 'border',
  },
};

// Typography variants
export const typographyVariants = {
  h1: {
    fontSize: 'fontSize.3xl',
    fontWeight: 'fontWeight.bold',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 'fontSize.2xl',
    fontWeight: 'fontWeight.semibold',
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 'fontSize.xl',
    fontWeight: 'fontWeight.semibold',
    lineHeight: 1.4,
  },
  body: {
    fontSize: 'fontSize.base',
    fontWeight: 'fontWeight.normal',
    lineHeight: 1.5,
  },
  small: {
    fontSize: 'fontSize.sm',
    fontWeight: 'fontWeight.normal',
    lineHeight: 1.5,
  },
};
