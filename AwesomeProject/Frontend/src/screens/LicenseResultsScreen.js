import React from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LicenseResultsScreen = ({ route }) => {
    const { results } = route.params;

    console.log('Results received:', results);

    if (!results || results.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>No Results Found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>License Results</Text>
            <FlatList
                data={results}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>{item.businessName || 'N/A'}</Text>
                        <Text>License Number: {item.licenseCodeDescription || 'N/A'}</Text>
                        <Text>License Status: {item.licenseStatusCode || 'N/A'}</Text>
                        <Text>Corporate Name: {item.corporateName || 'N/A'}</Text>
                        <Text>Firm Name: {item.businessName || 'N/A'}</Text>
                        <Text>Doing Business As: {item.doingBusinessAs || 'N/A'}</Text>
                        <Text>State Incorporation: {item.stateIncorporation || 'N/A'}</Text>
                        <Text>Address Type: {item.licenseAddressTypeDescription || 'N/A'}</Text>
                        <Text>Address Line 1: {item.addressLine1}{'\n'}{item.city}{', '}{item.state}{' '}{item.zip}</Text>
                        <Text>County: {item.countyCode || 'N/A'}</Text>
                        <Text>License Expiration Date: {item.expirationDate || 'N/A'}</Text>
                    </View>
                )}
            />
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
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 5,
    },
    title: {
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    // Additional styles
});

export default LicenseResultsScreen;