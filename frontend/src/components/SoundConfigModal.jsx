import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { soundManager, SOUND_TYPES } from '../utils/SoundManager';
import { Volume2 } from 'lucide-react';

const SoundConfigModal = ({ show, onHide }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundManager.isSoundEnabled);
  const [volume, setVolume] = useState(soundManager.volume);

  const handleToggleSound = () => {
    soundManager.toggleSound();
    setIsSoundEnabled(!isSoundEnabled);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  const playTestSound = (soundType) => {
    soundManager.play(soundType);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#00A0E3]" />
          Sound Settings
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="sound-toggle"
              label="Enable Sounds"
              checked={isSoundEnabled}
              onChange={handleToggleSound}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Volume</Form.Label>
            <Form.Range
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!isSoundEnabled}
            />
          </Form.Group>

          <div>
            <h6 className="text-[#0B1120] font-semibold mb-2">Test Sounds</h6>
            <div className="flex flex-wrap gap-2">
              {Object.values(SOUND_TYPES).map((soundType) => (
                <button
                  key={soundType}
                  className="px-3 py-1.5 text-sm border border-[#00A0E3] text-[#00A0E3] rounded-md hover:bg-[#00A0E3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => playTestSound(soundType)}
                  disabled={!isSoundEnabled}
                >
                  {soundType.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <button
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
          onClick={onHide}
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default SoundConfigModal;
