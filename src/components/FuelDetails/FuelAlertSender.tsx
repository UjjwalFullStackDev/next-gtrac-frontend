import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Send, MapPin, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface FuelAlertProps {
  isOpen: boolean;
  onClose: () => void;
  ambulanceNumber?: string;
  serviceId?: string;
}

interface AlertFormData {
  sys_service_id: string;
  ambulanceNumber: string;
  alertMessage: string;
  latitude: string;
  longitude: string;
}

const FuelAlertComponent: React.FC<FuelAlertProps> = ({ 
  isOpen, 
  onClose, 
  ambulanceNumber = '', 
  serviceId = '' 
}) => {
  const [formData, setFormData] = useState<AlertFormData>({
    sys_service_id: serviceId,
    ambulanceNumber: ambulanceNumber,
    alertMessage: '',
    latitude: '',
    longitude: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Pre-defined alert messages
  const alertTemplates = [
    'Fuel discrepancy detected - Manual reading differs significantly from software reading',
    'Suspicious fuel transaction - Amount exceeds normal limits',
    'Fuel pump location verification required',
    'Emergency fuel alert - Immediate attention needed',
    'Fuel efficiency concern - Usage pattern anomaly detected'
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        sys_service_id: serviceId,
        ambulanceNumber: ambulanceNumber
      }));
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, serviceId, ambulanceNumber]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get current location. Please enter coordinates manually.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({
      ...prev,
      alertMessage: template
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.sys_service_id.trim()) {
      setErrorMessage('Service ID is required');
      return false;
    }
    if (!formData.ambulanceNumber.trim()) {
      setErrorMessage('Ambulance Number is required');
      return false;
    }
    if (!formData.alertMessage.trim()) {
      setErrorMessage('Alert Message is required');
      return false;
    }
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      setErrorMessage('Location coordinates are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append('sys_service_id', formData.sys_service_id);
      formDataToSend.append('ambulanceNumber', formData.ambulanceNumber);
      formDataToSend.append('alertMessage', formData.alertMessage);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);

      const response = await fetch('http://gtarc.in:5001/api/v1/ambulance/fuel/alert', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
          // Reset form
          setFormData({
            sys_service_id: '',
            ambulanceNumber: '',
            alertMessage: '',
            latitude: '',
            longitude: ''
          });
        }, 2000);
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Fuel Alert</h2>
              <p className="text-sm text-gray-600">Report fuel discrepancy or suspicious activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Service ID and Ambulance Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service ID *
              </label>
              <input
                type="text"
                name="sys_service_id"
                value={formData.sys_service_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter service ID"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambulance Number *
              </label>
              <input
                type="text"
                name="ambulanceNumber"
                value={formData.ambulanceNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., AMB-001"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Alert Message Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Alert Templates
            </label>
            <div className="grid grid-cols-1 gap-2 mb-3">
              {alertTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors"
                  disabled={isSubmitting}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Alert Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Message *
            </label>
            <textarea
              name="alertMessage"
              value={formData.alertMessage}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Describe the fuel alert or concern..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Location Coordinates *
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation || isSubmitting}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {isGettingLocation ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span>{isGettingLocation ? 'Getting...' : 'Get Current'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Latitude"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Longitude"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Alert sent successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success'}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo component showing how to use the FuelAlertComponent
const FuelAlertDemo: React.FC = () => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  return (
    <div className="bg-gray-50 p-6">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Send Fuel Alert</span>
            </button>
          </div>
        </div>

        <FuelAlertComponent
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          ambulanceNumber="AMB-001"
          serviceId="SRV-123"
        />
      </div>
    </div>
  );
};

export default FuelAlertDemo;