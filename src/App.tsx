import { lazy, Suspense } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';

const Guides = lazy(() => import('./pages/Guides'));
const Upload = lazy(() => import('./pages/Upload'));

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/upload" element={<Upload />} />
            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
