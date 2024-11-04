import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WarningLetterScreen = () => {
    const [keyword, setKeyword] = useState('');
    const navigation = useNavigation();

    const fetchData = () => {
        fetch('http://10.0.0.3:5001/warning_letters', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firmName: keyword }),
        })
        .then(response => response.json())
        .then(result => {
            console.log("Received from server:", result); // Log the received data
            if (result.error) {
                Alert.alert('Error', result.error);
            } else {
                if (result.length > 0) { // Ensure the structure matches the received data
                    navigation.navigate('WarningLetterResultsScreen', { results: result });
                } else {
                    Alert.alert('No Results', 'No warning letters found for the provided criteria.');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data from the server');
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>FDA Warning Letter Search</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Firm Name"
                value={keyword}
                onChangeText={setKeyword}
            />
            <Button title="Search" onPress={fetchData} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: 'black',
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 20,
    },
});

export default WarningLetterScreen;
