import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Keyboard,
    Platform,
    Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';
import { MaterialIcons } from '@expo/vector-icons';
import { BACKEND_URL } from '../../config.js';
import * as Location from 'expo-location';
import { logQuery } from './HomeScreen';

const { width } = Dimensions.get('window');

const CAEntitySearchScreen = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    // Reset error when screen gains focus
    useFocusEffect(
        useCallback(() => {
            setError('');
        }, [])
    );

    const handleHistorySelect = (historyItem) => {
        setSearchTerm(historyItem.searchTerm || '');
        setError('');
    };

    const handleClearInput = () => {
        setSearchTerm('');
        setError('');
        Keyboard.dismiss();
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setError('');
        setSearchTerm('');
        setRefreshing(false);
    }, []);

    const validateSearch = () => {
        if (!searchTerm.trim()) {
            setError('Please enter a search term');
            return false;
        }
        if (searchTerm.trim().length < 2) {
            setError('Search term must be at least 2 characters');
            return false;
        }
        return true;
    };

    const fetchData = async () => {
        if (!validateSearch()) return;

        setIsLoading(true);
        setError('');
        Keyboard.dismiss();

        // Store search params immediately when user searches
        const searchParams = {
            searchTerm: searchTerm.trim()
        };

        logQuery("CAEntitySearch");

        // Save to history immediately when search is initiated
        try {
            await SearchHistoryService.saveSearch('CA_ENTITY', searchParams);
        } catch (error) {
            console.error('Error saving to history:', error);
            // Don't block the search if history saving fails
        }

        try {
            const response = await fetch(`${BACKEND_URL}/ca-business-entity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const result = await response.json();

            if (result.error) {
                setError(result.error);
                Alert.alert('Error', result.error);
            } else {
                if (result && result.length > 0) {
                    navigation.navigate('CAEntityResultsScreen', { results: result });
                } else {
                    Alert.alert(
                        'No Results',
                        'No business entities found matching your search criteria.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to connect to the server. Please try again.');
            Alert.alert(
                'Connection Error',
                'Unable to reach the server. Please check your connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const getLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        console.log(location["coords"]["latitude"], location["coords"]["longitude"]);

        fetch('https://gis.cdph.ca.gov/gisadmin/rest/services/Geocoding/USA2023R4/GeocodeServer/reverseGeocode?location=' + location["coords"]["longitude"] + '%2C' + location["coords"]["latitude"] + '&langCode=&locationType=&featureTypes=locality&outSR=&preferredLabelValues=&f=pjson', {
            method: 'GET'
        })
            .then(reponse => reponse.json())
            .then(result => {
                console.log(result);
                console.log(result["address"]["City"]);
                if (result["address"]["City"] == "") {
                    setSearchTerm(result["address"]["PlaceName"]);
                } else {
                    setSearchTerm(result["address"]["City"]);
                }
            });
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#007AFF']}
                    tintColor="#007AFF"
                />
            }
        >
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>CA Business Entity Search</Text>
                    <Text style={styles.subtitle}>
                        Search California Business Database
                    </Text>
                </View>

                <UniversalSearchHistory
                    searchType="CA_ENTITY"
                    onSelectHistory={handleHistorySelect}
                />

                <View style={styles.searchSection}>
                    <Text style={styles.label}>Business Name or Number*</Text>
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Enter business name or entity number"
                            value={searchTerm}
                            onChangeText={(text) => {
                                setSearchTerm(text);
                                setError('');
                            }}
                            placeholderTextColor="#666"
                            autoCapitalize="words"
                            returnKeyType="search"
                            onSubmitEditing={fetchData}
                            editable={!isLoading}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearInput}
                            >
                                <MaterialIcons name="clear" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.searchButton} onPress={getLocation}>
                            <Text>Use My Location</Text>
                        </TouchableOpacity>
                    </View>

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : (
                        <Text style={styles.hint}>
                            Enter business name, entity number, or LLC name
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.searchButton,
                        (!searchTerm.trim() || isLoading) && styles.searchButtonDisabled
                    ]}
                    onPress={fetchData}
                    disabled={isLoading || !searchTerm.trim()}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="search" size={24} color="#FFFFFF" />
                            <Text style={styles.searchButtonText}>Search</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.requiredField}>* Required field</Text>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        This search queries the California Secretary of State's
                        business database for active and inactive business entities.
                    </Text>
                </View>
            </View>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>
                        Searching Business Entities...
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    headerContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    searchSection: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#F8F8F8',
    },
    searchBar: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 8,
        marginRight: 8,
    },
    hint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 4,
        marginLeft: 4,
    },
    searchButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    requiredField: {
        fontSize: 12,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    infoContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D0E3FF',
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        textAlign: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    }
});

export default CAEntitySearchScreen;