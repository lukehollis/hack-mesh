using UnityEngine;
using System.Collections.Generic;
using Unity.MLAgents;

public class SwallowFlockManager : MonoBehaviour
{
    public int flockSize = 10;
    public float neighborRadius = 5f;
    public float separationWeight = 1.5f;
    public float alignmentWeight = 1.0f;
    public float cohesionWeight = 1.0f;
    
    private List<SwallowController> swallows;
    private Dictionary<SwallowController, float> flockRewards;

    void Start()
    {
        swallows = new List<SwallowController>();
        flockRewards = new Dictionary<SwallowController, float>();
        
        // Find all swallows in the scene
        SwallowController[] existingSwallows = FindObjectsOfType<SwallowController>();
        foreach (var swallow in existingSwallows)
        {
            AddSwallowToFlock(swallow);
        }
    }

    void AddSwallowToFlock(SwallowController swallow)
    {
        swallows.Add(swallow);
        flockRewards[swallow] = 0f;
    }

    public Vector3 CalculateFlockingBehavior(SwallowController currentSwallow)
    {
        Vector3 separation = Vector3.zero;
        Vector3 alignment = Vector3.zero;
        Vector3 cohesion = Vector3.zero;
        int neighborCount = 0;

        foreach (var neighbor in swallows)
        {
            if (neighbor == currentSwallow) continue;

            float distance = Vector3.Distance(currentSwallow.position, neighbor.position);
            if (distance <= neighborRadius)
            {
                // Separation
                Vector3 moveAway = currentSwallow.position - neighbor.position;
                separation += moveAway.normalized / distance;

                // Alignment
                alignment += neighbor.transform.forward;

                // Cohesion
                cohesion += neighbor.position;

                neighborCount++;
            }
        }

        if (neighborCount > 0)
        {
            alignment /= neighborCount;
            cohesion /= neighborCount;
            cohesion = (cohesion - currentSwallow.position).normalized;

            return (separation * separationWeight + 
                    alignment * alignmentWeight + 
                    cohesion * cohesionWeight) / 3f;
        }

        return Vector3.zero;
    }
}
