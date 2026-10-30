import React from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { LeftToolbar } from './components/layout/LeftToolbar';
import { RightPropertiesPanel } from './components/layout/RightPropertiesPanel';
import { BottomStatusBar } from './components/layout/BottomStatusBar';
import { VectorCanvas } from './components/canvas/VectorCanvas';
import { SpatialWorkspace } from './components/three/SpatialWorkspace';
import { VirtualCursor } from './components/hud/VirtualCursor';
import { FloatingCameraHud } from './components/hud/FloatingCameraHud';
import { VirtualAirKeyboard } from './components/keyboard/VirtualAirKeyboard';
import { AiDesignDrawer } from './components/ai/AiDesignDrawer';
import { ExportModal } from './components/modals/ExportModal';
import { GestureTrainingModal } from './components/modals/GestureTrainingModal';
import { PrivacySettingsModal } from './components/modals/PrivacySettingsModal';
import { QuickTutorialModal } from './components/modals/QuickTutorialModal';

const StudioMain: React.FC = () => {
  const { activeMode } = useStudio();

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#060810] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Center Layout: Left Toolbar + Canvas + Right Properties */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftToolbar />

        <main className="flex-1 relative overflow-hidden">
          {activeMode === '2d' ? <VectorCanvas /> : <SpatialWorkspace />}
        </main>

        <RightPropertiesPanel />
      </div>

      {/* Bottom Telemetry & Status Bar */}
      <BottomStatusBar />

      {/* Floating Spatial HUDs & Overlays */}
      <VirtualCursor />
      <FloatingCameraHud />
      <VirtualAirKeyboard />
      <AiDesignDrawer />

      {/* Modals */}
      <ExportModal />
      <GestureTrainingModal />
      <PrivacySettingsModal />
      <QuickTutorialModal />
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <StudioMain />
    </StudioProvider>
  );
}
