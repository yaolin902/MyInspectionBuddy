import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { BACKEND_URL } from '../../config.js';

const CDPHScreen = () => {
    const [deviceName, setDeviceName] = useState('');
    const [firmName, setFirmName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
    const [showFirmSuggestions, setShowFirmSuggestions] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadHistoricalSearches();
    }, []);

    const loadHistoricalSearches = async () => {
        try {
            const history = await SearchHistoryService.getHistory('CDPH');
            setSuggestions(history);
        } catch (error) {
            console.error('Error loading historical searches:', error);
        }
    };

    const handleDeviceNameChange = (text) => {
        setDeviceName(text);
        setShowDeviceSuggestions(text.length > 0);
        setShowFirmSuggestions(false);
    };

    const handleFirmNameChange = (text) => {
        setFirmName(text);
        setShowFirmSuggestions(text.length > 0);
        setShowDeviceSuggestions(false);
    };

    const handleSuggestionSelect = (historyItem) => {
        setDeviceName(historyItem.deviceName || '');
        setFirmName(historyItem.firmName || '');
        setShowDeviceSuggestions(false);
        setShowFirmSuggestions(false);
    };

    const renderDeviceSuggestions = () => {
        if (!showDeviceSuggestions || !deviceName.trim()) return null;

        const filteredSuggestions = suggestions.filter(item => 
            item.deviceName && 
            item.deviceName.toLowerCase().includes(deviceName.toLowerCase())
        );

        if (filteredSuggestions.length === 0) return null;

        return (
            <View style={styles.suggestionsContainer}>
                {filteredSuggestions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(item)}
                    >
                        <Text style={styles.suggestionPrimary}>{item.deviceName}</Text>
                        {item.firmName && (
                            <Text style={styles.suggestionSecondary}>
                                {`Firm: ${item.firmName}`}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderFirmSuggestions = () => {
        if (!showFirmSuggestions || !firmName.trim()) return null;

        const filteredSuggestions = suggestions.filter(item => 
            item.firmName && 
            item.firmName.toLowerCase().includes(firmName.toLowerCase())
        );

        if (filteredSuggestions.length === 0) return null;

        return (
            <View style={styles.suggestionsContainer}>
                {filteredSuggestions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(item)}
                    >
                        <Text style={styles.suggestionPrimary}>{item.firmName}</Text>
                        {item.deviceName && (
                            <Text style={styles.suggestionSecondary}>
                                {`Device: ${item.deviceName}`}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleHistorySelect = (historyItem) => {
        setDeviceName(historyItem.deviceName || '');
        setFirmName(historyItem.firmName || '');
    };

    const validateSearch = () => {
        if (!deviceName.trim() && !firmName.trim()) {
            Alert.alert('Error', 'Please enter either a device name or firm name');
            return false;
        }
        return true;
    };

    const handleSearch = async () => {
        if (!validateSearch()) return;

        setIsLoading(true);
        setError('');

        const searchParams = {
            deviceName: deviceName.trim(),
            firmName: firmName.trim()
        };

        try {
            await SearchHistoryService.saveSearch('CDPH', searchParams);
            await loadHistoricalSearches();

            const response = await fetch(`${BACKEND_URL}/cdph`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log("Results received:", data);
                navigation.navigate('CDPHResultsScreen', { results: data });
            } else {
                throw new Error(data.message || 'Unable to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            Alert.alert('Error', 'Failed to fetch data from the server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>CDPH Device Recalls Search</Text>

                <UniversalSearchHistory
                    searchType="CDPH"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Device Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Device Name"
                        value={deviceName}
                        onChangeText={handleDeviceNameChange}
                        onFocus={() => {
                            setShowDeviceSuggestions(true);
                            setShowFirmSuggestions(false);
                        }}
                    />
                    {renderDeviceSuggestions()}

                    <Text style={styles.label}>Firm Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Firm Name"
                        value={firmName}
                        onChangeText={handleFirmNameChange}
                        onFocus={() => {
                            setShowFirmSuggestions(true);
                            setShowDeviceSuggestions(false);
                        }}
                    />
                    {renderFirmSuggestions()}
                </View>

                <TouchableOpacity
                    style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                    onPress={handleSearch}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search</Text>
                    )}
                </TouchableOpacity>

                {error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : null}

                <Text style={styles.note}>
                    Enter at least one search criterion
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        fontSize: 16,
        marginBottom: 15,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    searchButtonDisabled: {
        backgroundColor: '#999',
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
    note: {
        color: '#666',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    suggestionsContainer: {
        marginTop: -10,
        marginBottom: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        maxHeight: 200,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionPrimary: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4,
    },
    suggestionSecondary: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    }
});

export default CDPHScreen;