import React, { ReactElement, Children } from 'react';
import { motion } from 'motion/react';

interface AnimatedListWrapperProps {
  children: ReactElement | ReactElement[];
  delay?: number;
}

export const AnimatedListWrapper: React.FC<AnimatedListWrapperProps> = ({ children, delay = 50 }) => {
  const childrenArray = Children.toArray(children);

  return (
    <>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: (index * delay) / 1000 }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
};

