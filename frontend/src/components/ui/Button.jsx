import { motion } from "framer-motion";

export default function Button({ variant = "secondary", icon: Icon, children, ...rest }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} className={`btn btn-${variant}`} {...rest}>
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
}
