import { Person } from "./interfaces";
import { backendRequest } from "./request";

export const getPersons = async (page = 1, pageSize = 10, search?: string) => {
    const query = `person?page=${page}&pageSize=${pageSize}${
        search ? `&search=${search}` : ""
    }`;
    const response = await backendRequest(query, "GET", true);
    return await response.json();
};

export const getPersonById = async (id: string) => {
    const response = await backendRequest(`person/${id}`, "GET", true);
    return await response.json();
};

export const getPersonInfoByCardIdWithSensitiveData = async (
    cardId: string
) => {
    const response = await backendRequest(
        `person/card/${cardId}/sensitive`,
        "GET",
        true
    );
    return {
        data: await response.json(),
        status: response.status,
    };
};

export const addStaffMember = async (name: string, gender: string) => {
    const response = await backendRequest("person/staff", "POST", true, {
        name,
        gender,
    });
    return response.status;
};
export const collectGfitpack = async (id: string) => {
    const response = await backendRequest(`person/giftpack/${id}`, "GET", true);
    return {
        data: await response.json(),
        status: response.status,
    };
};

export const giftpackCount = async () => {
    const response = await backendRequest("person/giftpack", "GET", true);
    return await response.json();
};

export const getAllPersons = async () => {
    const response = await backendRequest("person/all", "GET", true);
    return await response.json();
};

export const getPersonsWithoutCardAssigned = async () => {
    const response = await backendRequest("person/without-card", "GET", true);
    return await response.json();
};

export const updatePerson = async (data: Person) => {
    const response = await backendRequest(
        `person/${data.id}`,
        "PUT",
        true,
        data
    );
    return response.status;
};

export const filterPersons = (persons: Person[], search: string) => {
    return persons.filter(
        (person) =>
            person.name.toLowerCase().includes(search.toLowerCase()) ||
            (person.registrantId &&
                person.registrantId.toString().includes(search.toLowerCase()))
    );
};
