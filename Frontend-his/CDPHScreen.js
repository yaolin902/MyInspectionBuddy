import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UniversalSearchHistory from './UniversalSearchHistory';
import SearchHistoryService from './SearchHistoryService';

const { width } = Dimensions.get('window');

const CDPHScreen = () => {
    const [deviceName, setDeviceName] = useState('');
    const [firmName, setFirmName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigation = useNavigation();

    const handleHistorySelect = (historyItem) => {
        setDeviceName(historyItem.deviceName);
        setFirmName(historyItem.firmName);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        setError('');

        const searchParams = {
            deviceName,
            firmName
        };

        try {
            const response = await fetch('http://10.0.0.63:5001/cdph', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams),
            });

            const data = await response.json();
            if (response.ok) {
                // Save to history
                await SearchHistoryService.saveSearch('CDPH', searchParams);
                navigation.navigate('CDPHResultsScreen', { results: data });
            } else {
                throw new Error(data.message || 'Unable to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CDPH Device Recalls Search</Text>

            <UniversalSearchHistory
                searchType="CDPH"
                onSelectHistory={handleHistorySelect}
            />

            <View style={styles.inputContainer}>
                <Text>Device Name:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={deviceName}
                    onChangeText={setDeviceName}
                />
                <Text>Firm Name:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Bar"
                    value={firmName}
                    onChangeText={setFirmName}
                />
            </View>

            <Button title="Search" onPress={handleSearch} />

            {isLoading && <Text>Loading...</Text>}
            {error && <Text style={styles.errorText}>Error: {error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputContainer: {
        alignSelf: 'stretch',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    }
});

export default CDPHScreen;