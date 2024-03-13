import {useEffect, useState} from "react";
import {Box, Heading} from "@chakra-ui/react";
import {Incident} from "../../logic/interfaces.ts";
import {getUnresolvedAttempts} from "../../logic/attempt.ts";
import IncidentCard from "../../Components/IncidentCard.tsx";
import {useAtom} from "jotai";
import {getCompetitionInfo} from "../../logic/competition.ts";
import {competitionAtom} from "../../logic/atoms.ts";
import LoadingPage from "../../Components/LoadingPage.tsx";

const Incidents = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [competition, setCompetition] = useAtom(competitionAtom);

    useEffect(() => {
        getUnresolvedAttempts().then((data) => {
            setIncidents(data);
        });
    }, []);

    useEffect(() => {
        if (!competition) {
            getCompetitionInfo().then((res) => {
                setCompetition(res.data);
            });
        }
    }, [competition, setCompetition]);

    if (!competition) {
        return <LoadingPage/>;
    }

    return (
        <Box display="flex" flexDirection="column" gap="5">
            <Heading size="lg">Incidents</Heading>
            <Box display="flex" flexDirection="row" gap="5" flexWrap="wrap"
                 justifyContent={{base: "center", md: "left"}}>
                {incidents.map((incident) => (
                    <IncidentCard incident={incident} key={incident.id} wcif={competition.wcif}/>
                ))}
            </Box>
        </Box>
    );
};

export default Incidents;
